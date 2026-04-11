package com.sanele.flashcard;

import com.sanele.flashcard.entity.Card;
import com.sanele.flashcard.service.CardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

@SpringBootTest
@DisplayName("Spaced Repetition Algorithm Tests")
class SpacedRepetitionTest {

    @Autowired
    private CardService cardService;

    private Card card;

    @BeforeEach
    void setUp() {
        card = new Card();
        card.setEaseFactor(2.5);
        card.setInterval(1);
        card.setRepetitions(0);
        card.setNextReviewDate(LocalDate.now());
    }

    @Test
    @DisplayName("AGAIN (0) resets card to initial state")
    void again_resetsCard() {
        card.setRepetitions(5);
        card.setInterval(10);

        cardService.applySpacedRepetition(card, 0);

        assertThat(card.getRepetitions()).isEqualTo(0);
        assertThat(card.getInterval()).isEqualTo(1);
        assertThat(card.getNextReviewDate()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("HARD (1) resets card — rating below 3")
    void hard_resetsCard() {
        card.setRepetitions(3);
        card.setInterval(6);

        cardService.applySpacedRepetition(card, 1);

        assertThat(card.getRepetitions()).isEqualTo(0);
        assertThat(card.getInterval()).isEqualTo(1);
        assertThat(card.getNextReviewDate()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("GOOD (3) on first repetition sets interval to 1")
    void good_firstRepetition_intervalOne() {
        cardService.applySpacedRepetition(card, 3);

        assertThat(card.getRepetitions()).isEqualTo(1);
        assertThat(card.getInterval()).isEqualTo(1);
        assertThat(card.getNextReviewDate()).isEqualTo(LocalDate.now().plusDays(1));
    }

    @Test
    @DisplayName("GOOD (3) on second repetition sets interval to 6")
    void good_secondRepetition_intervalSix() {
        card.setRepetitions(1);
        card.setInterval(1);

        cardService.applySpacedRepetition(card, 3);

        assertThat(card.getRepetitions()).isEqualTo(2);
        assertThat(card.getInterval()).isEqualTo(6);
        assertThat(card.getNextReviewDate()).isEqualTo(LocalDate.now().plusDays(6));
    }

    @Test
    @DisplayName("EASY (5) increases ease factor and extends interval")
    void easy_increasesEaseFactorAndInterval() {
        card.setRepetitions(2);
        card.setInterval(6);
        card.setEaseFactor(2.5);

        cardService.applySpacedRepetition(card, 5);

        assertThat(card.getRepetitions()).isEqualTo(3);
        // interval = round(6 * 2.5) = 15
        assertThat(card.getInterval()).isEqualTo(15);
        // easeFactor = 2.5 + 0.1 - (5-5)*(0.08+(5-5)*0.02) = 2.6
        assertThat(card.getEaseFactor()).isCloseTo(2.6, within(0.001));
        assertThat(card.getNextReviewDate()).isEqualTo(LocalDate.now().plusDays(15));
    }

    @Test
    @DisplayName("GOOD (3) on third+ repetition scales interval by ease factor")
    void good_thirdRepetition_scalesInterval() {
        card.setRepetitions(2);
        card.setInterval(6);
        card.setEaseFactor(2.5);

        cardService.applySpacedRepetition(card, 3);

        assertThat(card.getRepetitions()).isEqualTo(3);
        // interval = round(6 * 2.5) = 15
        assertThat(card.getInterval()).isEqualTo(15);
        // easeFactor = 2.5 + 0.1 - (5-3)*(0.08+(5-3)*0.02) = 2.5 + 0.1 - 2*0.12 = 2.36
        assertThat(card.getEaseFactor()).isCloseTo(2.36, within(0.001));
    }

    @Test
    @DisplayName("Ease factor never drops below 1.3")
    void easeFactor_neverBelowMinimum() {
        card.setRepetitions(2);
        card.setInterval(6);
        card.setEaseFactor(1.3);

        // GOOD (3) with low ease factor
        cardService.applySpacedRepetition(card, 3);

        assertThat(card.getEaseFactor()).isGreaterThanOrEqualTo(1.3);
    }

    @Test
    @DisplayName("Progressive learning: AGAIN then GOOD sequence works correctly")
    void progressiveLearning_againThenGoodSequence() {
        // First attempt: AGAIN
        cardService.applySpacedRepetition(card, 0);
        assertThat(card.getRepetitions()).isEqualTo(0);
        assertThat(card.getInterval()).isEqualTo(1);

        // Second attempt: GOOD
        cardService.applySpacedRepetition(card, 3);
        assertThat(card.getRepetitions()).isEqualTo(1);
        assertThat(card.getInterval()).isEqualTo(1);

        // Third attempt: GOOD
        cardService.applySpacedRepetition(card, 3);
        assertThat(card.getRepetitions()).isEqualTo(2);
        assertThat(card.getInterval()).isEqualTo(6);

        // Fourth attempt: EASY — now enters long-interval territory
        cardService.applySpacedRepetition(card, 5);
        assertThat(card.getRepetitions()).isEqualTo(3);
        assertThat(card.getInterval()).isGreaterThan(6);
    }
}
