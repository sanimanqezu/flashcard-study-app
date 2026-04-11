package com.sanele.flashcard.repository;

import com.sanele.flashcard.entity.Card;
import com.sanele.flashcard.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findByDeckOrderByCreatedAtDesc(Deck deck);

    @Query("SELECT c FROM Card c WHERE c.deck = :deck AND c.nextReviewDate <= :today ORDER BY c.nextReviewDate ASC")
    List<Card> findDueCards(@Param("deck") Deck deck, @Param("today") LocalDate today);

    long countByDeck(Deck deck);

    long countByDeckAndRepetitionsGreaterThan(Deck deck, int repetitions);

    @Query("SELECT COUNT(c) FROM Card c WHERE c.deck = :deck AND c.nextReviewDate <= :today")
    long countDueCards(@Param("deck") Deck deck, @Param("today") LocalDate today);
}
