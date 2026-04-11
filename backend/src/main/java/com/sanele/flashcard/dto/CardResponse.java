package com.sanele.flashcard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private Long deckId;
    private String front;
    private String back;
    private double easeFactor;
    private int interval;
    private int repetitions;
    private LocalDate nextReviewDate;
    private LocalDateTime createdAt;
}
