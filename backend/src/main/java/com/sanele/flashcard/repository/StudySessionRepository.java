package com.sanele.flashcard.repository;

import com.sanele.flashcard.entity.StudySession;
import com.sanele.flashcard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserOrderByStartedAtDesc(User user);
}
