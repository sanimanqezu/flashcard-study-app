package com.sanele.flashcard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private Long id;
    private Long deckId;
    private String deckName;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private int cardsReviewed;
    private int cardsCorrect;
}
