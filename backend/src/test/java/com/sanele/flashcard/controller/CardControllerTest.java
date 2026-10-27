package com.sanele.flashcard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanele.flashcard.dto.CardRequest;
import com.sanele.flashcard.dto.CardResponse;
import com.sanele.flashcard.dto.ReviewRequest;
import com.sanele.flashcard.security.JwtAuthFilter;
import com.sanele.flashcard.service.CardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CardController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthFilter.class))
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(username = "sanele")
@DisplayName("CardController Slice Tests")
class CardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CardService cardService;

    private CardResponse sampleResponse() {
        return CardResponse.builder()
                .id(1L)
                .deckId(10L)
                .front("hola")
                .back("hello")
                .easeFactor(2.5)
                .interval(1)
                .repetitions(1)
                .nextReviewDate(LocalDate.now().plusDays(1))
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("GET cards returns 200 and the service results")
    void getCards_returnsOk() throws Exception {
        when(cardService.getCardsForDeck(eq(10L), eq("sanele")))
                .thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/decks/10/cards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].front").value("hola"));
    }

    @Test
    @DisplayName("POST card returns 201 and delegates to the service")
    void addCard_returnsCreated() throws Exception {
        CardRequest request = new CardRequest();
        request.setFront("gato");
        request.setBack("cat");
        when(cardService.addCard(eq(10L), any(CardRequest.class), eq("sanele")))
                .thenReturn(sampleResponse());

        mockMvc.perform(post("/api/decks/10/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L));

        verify(cardService).addCard(eq(10L), any(CardRequest.class), eq("sanele"));
    }

    @Test
    @DisplayName("POST card with blank content returns 400")
    void addCard_blankContent_returnsBadRequest() throws Exception {
        CardRequest request = new CardRequest();
        request.setFront("");
        request.setBack("");

        mockMvc.perform(post("/api/decks/10/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    @DisplayName("POST review with rating out of range returns 400")
    void reviewCard_invalidRating_returnsBadRequest() throws Exception {
        ReviewRequest request = new ReviewRequest();
        request.setRating(7);

        mockMvc.perform(post("/api/cards/3/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST review delegates the rating to the service")
    void reviewCard_returnsOk() throws Exception {
        ReviewRequest request = new ReviewRequest();
        request.setRating(3);
        when(cardService.reviewCard(eq(3L), eq(3), eq("sanele")))
                .thenReturn(sampleResponse());

        mockMvc.perform(post("/api/cards/3/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.repetitions").value(1));

        verify(cardService).reviewCard(eq(3L), eq(3), eq("sanele"));
    }

    @Test
    @DisplayName("DELETE card returns 204")
    void deleteCard_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/cards/5"))
                .andExpect(status().isNoContent());

        verify(cardService).deleteCard(eq(5L), eq("sanele"));
    }

    @Test
    @DisplayName("A missing card is mapped to 404 by the exception handler")
    void missingCard_returnsNotFound() throws Exception {
        when(cardService.getCardsForDeck(eq(99L), eq("sanele")))
                .thenThrow(new NoSuchElementException("Deck not found: 99"));

        mockMvc.perform(get("/api/decks/99/cards"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Deck not found: 99"));
    }

    @Test
    @DisplayName("An access violation is mapped to 403 by the exception handler")
    void accessDenied_returnsForbidden() throws Exception {
        when(cardService.getCardsForDeck(eq(10L), eq("sanele")))
                .thenThrow(new AccessDeniedException("Access denied to deck: 10"));

        mockMvc.perform(get("/api/decks/10/cards"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
