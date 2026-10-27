package com.sanele.flashcard.service;

import com.sanele.flashcard.dto.CardRequest;
import com.sanele.flashcard.dto.CardResponse;
import com.sanele.flashcard.dto.ProgressResponse;
import com.sanele.flashcard.entity.Card;
import com.sanele.flashcard.entity.Deck;
import com.sanele.flashcard.entity.User;
import com.sanele.flashcard.repository.CardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CardService Unit Tests")
class CardServiceTest {

    @Mock
    private CardRepository cardRepository;

    @Mock
    private DeckService deckService;

    @InjectMocks
    private CardService cardService;

    private User user;
    private Deck deck;

    private static final String USERNAME = "sanele";

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username(USERNAME).build();
        deck = Deck.builder().id(10L).user(user).name("Spanish").build();
    }

    private Card newCard(Long id) {
        Card card = Card.builder()
                .id(id)
                .deck(deck)
                .front("hola")
                .back("hello")
                .easeFactor(2.5)
                .interval(1)
                .repetitions(0)
                .nextReviewDate(LocalDate.now())
                .build();
        return card;
    }

    @Test
    @DisplayName("getCardsForDeck maps every card to a response")
    void getCardsForDeck_returnsMappedResponses() {
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(deckService.getDeckForUser(10L, user)).thenReturn(deck);
        when(cardRepository.findByDeckOrderByCreatedAtDesc(deck))
                .thenReturn(List.of(newCard(1L), newCard(2L)));

        List<CardResponse> result = cardService.getCardsForDeck(10L, USERNAME);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(CardResponse::getDeckId).containsOnly(10L);
        assertThat(result).extracting(CardResponse::getFront).containsOnly("hola");
    }

    @Test
    @DisplayName("addCard persists a new card and returns its response")
    void addCard_savesAndReturns() {
        CardRequest request = new CardRequest();
        request.setFront("gato");
        request.setBack("cat");
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(deckService.getDeckForUser(10L, user)).thenReturn(deck);
        when(cardRepository.save(any(Card.class))).thenAnswer(inv -> {
            Card c = inv.getArgument(0);
            c.setId(99L);
            return c;
        });

        CardResponse response = cardService.addCard(10L, request, USERNAME);

        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getFront()).isEqualTo("gato");
        assertThat(response.getBack()).isEqualTo("cat");
        verify(cardRepository).save(any(Card.class));
    }

    @Test
    @DisplayName("updateCard overwrites front and back of an owned card")
    void updateCard_updatesOwnedCard() {
        Card card = newCard(5L);
        CardRequest request = new CardRequest();
        request.setFront("perro");
        request.setBack("dog");
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(cardRepository.findById(5L)).thenReturn(Optional.of(card));
        when(cardRepository.save(card)).thenReturn(card);

        CardResponse response = cardService.updateCard(5L, request, USERNAME);

        assertThat(response.getFront()).isEqualTo("perro");
        assertThat(response.getBack()).isEqualTo("dog");
    }

    @Test
    @DisplayName("updateCard throws NoSuchElementException when the card is missing")
    void updateCard_notFound_throws() {
        CardRequest request = new CardRequest();
        request.setFront("x");
        request.setBack("y");
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(cardRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cardService.updateCard(404L, request, USERNAME))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("404");
        verify(cardRepository, never()).save(any());
    }

    @Test
    @DisplayName("deleteCard rejects a card owned by another user")
    void deleteCard_otherUsersCard_throwsAccessDenied() {
        User otherOwner = User.builder().id(2L).username("intruder").build();
        Deck otherDeck = Deck.builder().id(20L).user(otherOwner).build();
        Card card = newCard(7L);
        card.setDeck(otherDeck);
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(cardRepository.findById(7L)).thenReturn(Optional.of(card));

        assertThatThrownBy(() -> cardService.deleteCard(7L, USERNAME))
                .isInstanceOf(AccessDeniedException.class);
        verify(cardRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteCard removes an owned card")
    void deleteCard_ownedCard_deletes() {
        Card card = newCard(7L);
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(cardRepository.findById(7L)).thenReturn(Optional.of(card));

        cardService.deleteCard(7L, USERNAME);

        verify(cardRepository).delete(card);
    }

    @Test
    @DisplayName("getDueCards returns at most 20 cards")
    void getDueCards_cappedAtTwenty() {
        List<Card> due = java.util.stream.IntStream.range(0, 30)
                .mapToObj(i -> newCard((long) i))
                .collect(java.util.stream.Collectors.toList());
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(deckService.getDeckForUser(10L, user)).thenReturn(deck);
        when(cardRepository.findDueCards(eq(deck), any(LocalDate.class))).thenReturn(due);

        List<CardResponse> result = cardService.getDueCards(10L, USERNAME);

        assertThat(result).hasSize(20);
    }

    @Test
    @DisplayName("reviewCard applies the schedule and persists the card")
    void reviewCard_appliesSpacedRepetition() {
        Card card = newCard(3L);
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(cardRepository.findById(3L)).thenReturn(Optional.of(card));
        when(cardRepository.save(card)).thenReturn(card);

        CardResponse response = cardService.reviewCard(3L, 3, USERNAME);

        assertThat(response.getRepetitions()).isEqualTo(1);
        assertThat(response.getNextReviewDate()).isEqualTo(LocalDate.now().plusDays(1));
        verify(cardRepository).save(card);
    }

    @Test
    @DisplayName("getProgress computes mastery percentage from counts")
    void getProgress_computesMastery() {
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(deckService.getDeckForUser(10L, user)).thenReturn(deck);
        when(cardRepository.countByDeck(deck)).thenReturn(8L);
        when(cardRepository.countDueCards(eq(deck), any(LocalDate.class))).thenReturn(2L);
        when(cardRepository.countByDeckAndRepetitionsGreaterThan(deck, 0)).thenReturn(2L);

        ProgressResponse response = cardService.getProgress(10L, USERNAME);

        assertThat(response.getTotalCards()).isEqualTo(8L);
        assertThat(response.getDueToday()).isEqualTo(2L);
        assertThat(response.getLearned()).isEqualTo(2L);
        assertThat(response.getMasteryPercent()).isEqualTo(25.0);
    }

    @Test
    @DisplayName("getProgress reports zero mastery for an empty deck")
    void getProgress_emptyDeck_zeroMastery() {
        when(deckService.getUser(USERNAME)).thenReturn(user);
        when(deckService.getDeckForUser(10L, user)).thenReturn(deck);
        when(cardRepository.countByDeck(deck)).thenReturn(0L);
        when(cardRepository.countDueCards(eq(deck), any(LocalDate.class))).thenReturn(0L);
        when(cardRepository.countByDeckAndRepetitionsGreaterThan(deck, 0)).thenReturn(0L);

        ProgressResponse response = cardService.getProgress(10L, USERNAME);

        assertThat(response.getMasteryPercent()).isEqualTo(0.0);
    }
}
