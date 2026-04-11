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
public class DeckResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private long totalCards;
    private long dueToday;
}
