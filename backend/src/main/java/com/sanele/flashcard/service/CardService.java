package com.sanele.flashcard.service;

import com.sanele.flashcard.dto.CardRequest;
import com.sanele.flashcard.dto.CardResponse;
import com.sanele.flashcard.dto.ProgressResponse;
import com.sanele.flashcard.entity.Card;
import com.sanele.flashcard.entity.Deck;
import com.sanele.flashcard.entity.User;
import com.sanele.flashcard.repository.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final DeckService deckService;

    public List<CardResponse> getCardsForDeck(Long deckId, String username) {
        User user = deckService.getUser(username);
        Deck deck = deckService.getDeckForUser(deckId, user);
        return cardRepository.findByDeckOrderByCreatedAtDesc(deck).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CardResponse addCard(Long deckId, CardRequest request, String username) {
        User user = deckService.getUser(username);
        Deck deck = deckService.getDeckForUser(deckId, user);
        Card card = Card.builder()
                .deck(deck)
                .front(request.getFront())
                .back(request.getBack())
                .build();
        card = cardRepository.save(card);
        return toResponse(card);
    }

    @Transactional
    public CardResponse updateCard(Long cardId, CardRequest request, String username) {
        User user = deckService.getUser(username);
        Card card = getCardForUser(cardId, user);
        card.setFront(request.getFront());
        card.setBack(request.getBack());
        card = cardRepository.save(card);
        return toResponse(card);
    }

    @Transactional
    public void deleteCard(Long cardId, String username) {
        User user = deckService.getUser(username);
        Card card = getCardForUser(cardId, user);
        cardRepository.delete(card);
    }

    public List<CardResponse> getDueCards(Long deckId, String username) {
        User user = deckService.getUser(username);
        Deck deck = deckService.getDeckForUser(deckId, user);
        return cardRepository.findDueCards(deck, LocalDate.now()).stream()
                .limit(20)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CardResponse reviewCard(Long cardId, int rating, String username) {
        User user = deckService.getUser(username);
        Card card = getCardForUser(cardId, user);
        applySpacedRepetition(card, rating);
        card = cardRepository.save(card);
        return toResponse(card);
    }

    public ProgressResponse getProgress(Long deckId, String username) {
        User user = deckService.getUser(username);
        Deck deck = deckService.getDeckForUser(deckId, user);
        long total = cardRepository.countByDeck(deck);
        long due = cardRepository.countDueCards(deck, LocalDate.now());
        long learned = cardRepository.countByDeckAndRepetitionsGreaterThan(deck, 0);
        double mastery = total == 0 ? 0.0 : Math.round((learned * 100.0) / total * 10.0) / 10.0;
        return ProgressResponse.builder()
                .totalCards(total)
                .dueToday(due)
                .learned(learned)
                .masteryPercent(mastery)
                .build();
    }

    /**
     * Simplified SM-2 spaced repetition algorithm.
     * Ratings: AGAIN=0, HARD=1, GOOD=3, EASY=5
     */
    void applySpacedRepetition(Card card, int rating) {
        LocalDate today = LocalDate.now();

        if (rating < 3) {
            // Fail: reset progress
            card.setRepetitions(0);
            card.setInterval(1);
            card.setNextReviewDate(today);
        } else {
            // Pass: advance schedule
            card.setRepetitions(card.getRepetitions() + 1);

            int newInterval;
            if (card.getRepetitions() == 1) {
                newInterval = 1;
            } else if (card.getRepetitions() == 2) {
                newInterval = 6;
            } else {
                newInterval = (int) Math.round(card.getInterval() * card.getEaseFactor());
            }
            card.setInterval(newInterval);

            double newEaseFactor = card.getEaseFactor()
                    + 0.1
                    - (5 - rating) * (0.08 + (5 - rating) * 0.02);
            card.setEaseFactor(Math.max(1.3, newEaseFactor));

            card.setNextReviewDate(today.plusDays(newInterval));
        }
    }

    private Card getCardForUser(Long cardId, User user) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));
        if (!card.getDeck().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied to card: " + cardId);
        }
        return card;
    }

    public CardResponse toResponse(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .deckId(card.getDeck().getId())
                .front(card.getFront())
                .back(card.getBack())
                .easeFactor(card.getEaseFactor())
                .interval(card.getInterval())
                .repetitions(card.getRepetitions())
                .nextReviewDate(card.getNextReviewDate())
                .createdAt(card.getCreatedAt())
                .build();
    }
}
