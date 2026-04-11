package com.sanele.flashcard.service;

import com.sanele.flashcard.dto.SessionCompleteRequest;
import com.sanele.flashcard.dto.SessionRequest;
import com.sanele.flashcard.dto.SessionResponse;
import com.sanele.flashcard.entity.Deck;
import com.sanele.flashcard.entity.StudySession;
import com.sanele.flashcard.entity.User;
import com.sanele.flashcard.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class StudySessionService {

    private final StudySessionRepository sessionRepository;
    private final DeckService deckService;

    @Transactional
    public SessionResponse startSession(SessionRequest request, String username) {
        User user = deckService.getUser(username);
        Deck deck = deckService.getDeckForUser(request.getDeckId(), user);

        StudySession session = StudySession.builder()
                .user(user)
                .deck(deck)
                .startedAt(LocalDateTime.now())
                .build();

        session = sessionRepository.save(session);
        return toResponse(session);
    }

    @Transactional
    public SessionResponse completeSession(Long sessionId, SessionCompleteRequest request, String username) {
        User user = deckService.getUser(username);
        StudySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Session not found: " + sessionId));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied to session: " + sessionId);
        }

        session.setCompletedAt(LocalDateTime.now());
        session.setCardsReviewed(request.getCardsReviewed());
        session.setCardsCorrect(request.getCardsCorrect());
        session = sessionRepository.save(session);
        return toResponse(session);
    }

    private SessionResponse toResponse(StudySession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .deckId(session.getDeck().getId())
                .deckName(session.getDeck().getName())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .cardsReviewed(session.getCardsReviewed())
                .cardsCorrect(session.getCardsCorrect())
                .build();
    }
}
