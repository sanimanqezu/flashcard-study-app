package com.sanele.flashcard.service;

import com.sanele.flashcard.dto.DeckRequest;
import com.sanele.flashcard.dto.DeckResponse;
import com.sanele.flashcard.entity.Deck;
import com.sanele.flashcard.entity.User;
import com.sanele.flashcard.repository.CardRepository;
import com.sanele.flashcard.repository.DeckRepository;
import com.sanele.flashcard.repository.UserRepository;
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
public class DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final CardRepository cardRepository;

    public List<DeckResponse> getAllDecks(String username) {
        User user = getUser(username);
        return deckRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(deck -> toResponse(deck, user))
                .collect(Collectors.toList());
    }

    public DeckResponse getDeck(Long deckId, String username) {
        User user = getUser(username);
        Deck deck = getDeckForUser(deckId, user);
        return toResponse(deck, user);
    }

    @Transactional
    public DeckResponse createDeck(DeckRequest request, String username) {
        User user = getUser(username);
        Deck deck = Deck.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .build();
        deck = deckRepository.save(deck);
        return toResponse(deck, user);
    }

    @Transactional
    public DeckResponse updateDeck(Long deckId, DeckRequest request, String username) {
        User user = getUser(username);
        Deck deck = getDeckForUser(deckId, user);
        deck.setName(request.getName());
        deck.setDescription(request.getDescription());
        deck = deckRepository.save(deck);
        return toResponse(deck, user);
    }

    @Transactional
    public void deleteDeck(Long deckId, String username) {
        User user = getUser(username);
        Deck deck = getDeckForUser(deckId, user);
        deckRepository.delete(deck);
    }

    public Deck getDeckForUser(Long deckId, User user) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new NoSuchElementException("Deck not found: " + deckId));
        if (!deck.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied to deck: " + deckId);
        }
        return deck;
    }

    public User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + username));
    }

    private DeckResponse toResponse(Deck deck, User user) {
        long total = cardRepository.countByDeck(deck);
        long due = cardRepository.countDueCards(deck, LocalDate.now());
        return DeckResponse.builder()
                .id(deck.getId())
                .name(deck.getName())
                .description(deck.getDescription())
                .createdAt(deck.getCreatedAt())
                .totalCards(total)
                .dueToday(due)
                .build();
    }
}
