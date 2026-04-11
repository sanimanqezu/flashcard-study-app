package com.sanele.flashcard.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CardRequest {

    @NotBlank(message = "Front content is required")
    private String front;

    @NotBlank(message = "Back content is required")
    private String back;
}
