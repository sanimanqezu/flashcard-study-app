package com.sanele.flashcard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String front;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String back;

    @Column(nullable = false)
    @Builder.Default
    private double easeFactor = 2.5;

    @Column(nullable = false)
    @Builder.Default
    private int interval = 1;

    @Column(nullable = false)
    @Builder.Default
    private int repetitions = 0;

    @Column(nullable = false)
    @Builder.Default
    private LocalDate nextReviewDate = LocalDate.now();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
