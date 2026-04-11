package com.sanele.flashcard.controller;

import com.sanele.flashcard.dto.CardRequest;
import com.sanele.flashcard.dto.CardResponse;
import com.sanele.flashcard.dto.ProgressResponse;
import com.sanele.flashcard.dto.ReviewRequest;
import com.sanele.flashcard.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @GetMapping("/api/decks/{deckId}/cards")
    public ResponseEntity<List<CardResponse>> getCards(@PathVariable Long deckId,
                                                        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(cardService.getCardsForDeck(deckId, user.getUsername()));
    }

    @PostMapping("/api/decks/{deckId}/cards")
    public ResponseEntity<CardResponse> addCard(@PathVariable Long deckId,
                                                 @Valid @RequestBody CardRequest request,
                                                 @AuthenticationPrincipal UserDetails user) {
        CardResponse response = cardService.addCard(deckId, request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/api/cards/{cardId}")
    public ResponseEntity<CardResponse> updateCard(@PathVariable Long cardId,
                                                    @Valid @RequestBody CardRequest request,
                                                    @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(cardService.updateCard(cardId, request, user.getUsername()));
    }

    @DeleteMapping("/api/cards/{cardId}")
    public ResponseEntity<Void> deleteCard(@PathVariable Long cardId,
                                            @AuthenticationPrincipal UserDetails user) {
        cardService.deleteCard(cardId, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/decks/{deckId}/study")
    public ResponseEntity<List<CardResponse>> getDueCards(@PathVariable Long deckId,
                                                           @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(cardService.getDueCards(deckId, user.getUsername()));
    }

    @PostMapping("/api/cards/{cardId}/review")
    public ResponseEntity<CardResponse> reviewCard(@PathVariable Long cardId,
                                                    @Valid @RequestBody ReviewRequest request,
                                                    @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(cardService.reviewCard(cardId, request.getRating(), user.getUsername()));
    }

    @GetMapping("/api/decks/{deckId}/progress")
    public ResponseEntity<ProgressResponse> getProgress(@PathVariable Long deckId,
                                                         @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(cardService.getProgress(deckId, user.getUsername()));
    }
}
