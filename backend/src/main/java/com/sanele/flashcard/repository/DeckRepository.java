package com.sanele.flashcard.repository;

import com.sanele.flashcard.entity.Deck;
import com.sanele.flashcard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
    List<Deck> findByUserOrderByCreatedAtDesc(User user);
    Optional<Deck> findByIdAndUser(Long id, User user);
}
