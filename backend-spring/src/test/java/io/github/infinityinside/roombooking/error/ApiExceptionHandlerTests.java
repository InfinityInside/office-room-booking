package io.github.infinityinside.roombooking.error;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.infinityinside.roombooking.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class ApiExceptionHandlerTests {

    @Autowired private MockMvcTester mvc;

    @Test
    void notFoundBecomes404Problem() {
        assertThat(mvc.get().uri("/api/test/errors/not-found"))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .isLenientlyEqualTo("""
                        {
                            "title": "Not Found",
                            "status": 404,
                            "detail": "Room 42 was not found.",
                            "instance": "/api/test/errors/not-found"
                        }
                        """);
    }

    @Test
    void conflictBecomes409Problem() {
        assertThat(mvc.get().uri("/api/test/errors/conflict"))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "status": 409, "detail": "This code is already taken." }
                        """);
    }

    @Test
    void invalidBodyBecomes422WithFieldErrors() {
        assertThat(mvc.post().uri("/api/test/errors/validated")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                                { "name": "", "capacity": 0 }
                                """))
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.errors[*].field")
                .asArray()
                .containsExactlyInAnyOrder("name", "capacity");
    }

    @Test
    void malformedJsonBecomes400Problem() {
        assertThat(mvc.post().uri("/api/test/errors/validated")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ not json"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void unknownRouteBecomes404Problem() {
        assertThat(mvc.get().uri("/api/does-not-exist"))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void wrongMethodBecomes405Problem() {
        assertThat(mvc.put().uri("/api/equipment-types"))
                .hasStatus(HttpStatus.METHOD_NOT_ALLOWED)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void uniqueViolationBecomes409WithAFriendlyMessage() {
        assertThat(mvc.post().uri("/api/test/errors/duplicate-equipment-code"))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "detail": "An equipment type with this code already exists." }
                        """);
    }

    @Test
    void foreignKeyViolationBecomes409() {
        assertThat(mvc.post().uri("/api/test/errors/delete-equipment-in-use"))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "detail": "This item is still in use, so it can't be deleted." }
                        """);
    }

    @Test
    void unexpectedErrorsBecome500WithoutInternals() {
        assertThat(mvc.get().uri("/api/test/errors/unexpected"))
                .hasStatus(HttpStatus.INTERNAL_SERVER_ERROR)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyText()
                .contains("Something went wrong")
                .doesNotContain("secret");
    }
}