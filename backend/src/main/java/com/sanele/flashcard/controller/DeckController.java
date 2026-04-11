package com.sanele.flashcard.controller;

import com.sanele.flashcard.dto.DeckRequest;
import com.sanele.flashcard.dto.DeckResponse;
import com.sanele.flashcard.service.DeckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @GetMapping
    public ResponseEntity<List<DeckResponse>> getAllDecks(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deckService.getAllDecks(user.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckResponse> getDeck(@PathVariable Long id,
                                                 @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deckService.getDeck(id, user.getUsername()));
    }

    @PostMapping
    public ResponseEntity<DeckResponse> createDeck(@Valid @RequestBody DeckRequest request,
                                                    @AuthenticationPrincipal UserDetails user) {
        DeckResponse response = deckService.createDeck(request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeckResponse> updateDeck(@PathVariable Long id,
                                                    @Valid @RequestBody DeckRequest request,
                                                    @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deckService.updateDeck(id, request, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long id,
                                            @AuthenticationPrincipal UserDetails user) {
        deckService.deleteDeck(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
