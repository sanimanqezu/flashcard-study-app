package com.sanele.flashcard.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SessionCompleteRequest {

    @NotNull(message = "cardsReviewed is required")
    @Min(value = 0)
    private Integer cardsReviewed;

    @NotNull(message = "cardsCorrect is required")
    @Min(value = 0)
    private Integer cardsCorrect;
}
