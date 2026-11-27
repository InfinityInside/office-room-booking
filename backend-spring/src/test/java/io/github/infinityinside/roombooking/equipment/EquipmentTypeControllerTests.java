package io.github.infinityinside.roombooking.equipment;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.infinityinside.roombooking.IntegrationTest;
import io.github.infinityinside.roombooking.security.TestUsers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class EquipmentTypeControllerTests {

    @Autowired
    private MockMvcTester mvc;
    @Autowired
    private EquipmentTypeRepository equipmentTypes;
    @Autowired
    private TestUsers testUsers;

    @Test
    void listsEquipmentTypesSortedByName() {
        equipmentTypes.save(new EquipmentType("WHITEBOARD", "Whiteboard"));
        equipmentTypes.save(new EquipmentType("PROJECTOR", "Projector"));

        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, testUsers.bearerForNewUser()))
                .hasStatusOk()
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON)
                .bodyJson()
                .isLenientlyEqualTo("""
                        [
                            { "code": "PROJECTOR", "name": "Projector" },
                            { "code": "WHITEBOARD", "name": "Whiteboard" }
                        ]
                        """);

        assertThat(mvc.get().uri("/api/equipment-types").header(HttpHeaders.AUTHORIZATION, testUsers.bearerForNewUser()))
                .bodyJson()
                .extractingPath("$[*].code")
                .asArray()
                .containsExactly("PROJECTOR", "WHITEBOARD");
    }

    @Test
    void servesTheApiOnlyUnderTheApiPrefix() {
        assertThat(mvc.get().uri("/equipment-types").header(HttpHeaders.AUTHORIZATION, testUsers.bearerForNewUser())).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void keepsActuatorOutsideTheApiPrefix() {
        assertThat(mvc.get().uri("/actuator/health")).hasStatusOk();
    }

}