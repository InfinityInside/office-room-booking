package io.github.infinityinside.roombooking.equipment;

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
class EquipmentTypeControllerTests {

    @Autowired private MockMvcTester mvc;
    @Autowired private EquipmentTypeRepository equipmentTypes;

    @Test
    void listsEquipmentTypesSortedByName() {
        equipmentTypes.save(new EquipmentType("WHITEBOARD", "Whiteboard"));
        equipmentTypes.save(new EquipmentType("PROJECTOR", "Projector"));

        assertThat(mvc.get().uri("/api/equipment-types"))
                .hasStatusOk()
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON)
                .bodyJson()
                .isLenientlyEqualTo("""
                        [
                            { "code": "PROJECTOR", "name": "Projector" },
                            { "code": "WHITEBOARD", "name": "Whiteboard" }
                        ]
                        """);

        assertThat(mvc.get().uri("/api/equipment-types"))
                .bodyJson()
                .extractingPath("$[*].code")
                .asArray()
                .containsExactly("PROJECTOR", "WHITEBOARD");
    }

    @Test
    void servesTheApiOnlyUnderTheApiPrefix() {
        assertThat(mvc.get().uri("/equipment-types")).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void keepsActuatorOutsideTheApiPrefix() {
        assertThat(mvc.get().uri("/actuator/health")).hasStatusOk();
    }

    @Test
    void answersNotImplementedForEndpointsNotWrittenYet() {
        assertThat(mvc.delete().uri("/api/admin/equipment-types/1")).hasStatus(HttpStatus.NOT_IMPLEMENTED);
    }
}