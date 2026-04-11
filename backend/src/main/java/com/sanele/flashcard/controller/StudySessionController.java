package com.sanele.flashcard.controller;

import com.sanele.flashcard.dto.SessionCompleteRequest;
import com.sanele.flashcard.dto.SessionRequest;
import com.sanele.flashcard.dto.SessionResponse;
import com.sanele.flashcard.service.StudySessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class StudySessionController {

    private final StudySessionService sessionService;

    @PostMapping("/start")
    public ResponseEntity<SessionResponse> startSession(@Valid @RequestBody SessionRequest request,
                                                         @AuthenticationPrincipal UserDetails user) {
        SessionResponse response = sessionService.startSession(request, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SessionResponse> completeSession(@PathVariable Long id,
                                                            @Valid @RequestBody SessionCompleteRequest request,
                                                            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(sessionService.completeSession(id, request, user.getUsername()));
    }
}
