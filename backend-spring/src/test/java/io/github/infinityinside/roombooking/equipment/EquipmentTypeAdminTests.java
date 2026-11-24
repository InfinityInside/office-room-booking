package io.github.infinityinside.roombooking.equipment;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.infinityinside.roombooking.IntegrationTest;
import io.github.infinityinside.roombooking.room.Room;
import io.github.infinityinside.roombooking.room.RoomRepository;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class EquipmentTypeAdminTests {

    private static final String BASE = "/api/admin/equipment-types";

    @Autowired private MockMvcTester mvc;
    @Autowired private EquipmentTypeRepository equipmentTypes;
    @Autowired private RoomRepository rooms;

    private EquipmentType projector;

    @BeforeEach
    void createProjector() {
        projector = equipmentTypes.save(new EquipmentType("PROJECTOR", "Projector"));
    }

    // Create

    @Test
    void createsAnEquipmentTypeWithATrimmedName() {
        assertThat(post(BASE, """
                { "code": "SPEAKERPHONE", "name": "  Speakerphone  " }
                """))
                .hasStatus(HttpStatus.CREATED)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "code": "SPEAKERPHONE", "name": "Speakerphone" }
                        """);

        assertThat(equipmentTypes.existsByCode("SPEAKERPHONE")).isTrue();
    }

    @Test
    void rejectsAnInvalidCodeAndABlankName() {
        assertThat(post(BASE, """
                { "code": "speaker phone", "name": "   " }
                """))
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .bodyJson()
                .extractingPath("$.errors[*].field")
                .asArray()
                .containsExactlyInAnyOrder("code", "name");
    }

    @Test
    void rejectsATakenCode() {
        assertThat(post(BASE, """
                { "code": "PROJECTOR", "name": "Beamer" }
                """))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "detail": "An equipment type with the code PROJECTOR already exists." }
                        """);
    }

    @Test
    void rejectsATakenNameIgnoringCase() {
        assertThat(post(BASE, """
                { "code": "BEAMER", "name": "PROJECTOR" }
                """))
                .hasStatus(HttpStatus.CONFLICT);
    }

    // Rename

    @Test
    void renamesAnEquipmentType() {
        assertThat(patch(BASE + "/" + projector.getId(), """
                { "name": "Beamer" }
                """))
                .hasStatusOk()
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "code": "PROJECTOR", "name": "Beamer" }
                        """);
    }

    @Test
    void allowsChangingOnlyTheCaseOfTheName() {
        assertThat(patch(BASE + "/" + projector.getId(), """
                { "name": "PROJECTOR" }
                """))
                .hasStatusOk();
    }

    @Test
    void rejectsRenamingToAnotherTypesName() {
        equipmentTypes.save(new EquipmentType("WHITEBOARD", "Whiteboard"));

        assertThat(patch(BASE + "/" + projector.getId(), """
                { "name": "whiteboard" }
                """))
                .hasStatus(HttpStatus.CONFLICT);
    }

    @Test
    void renamingAnUnknownTypeIs404() {
        assertThat(patch(BASE + "/999999", """
                { "name": "Beamer" }
                """))
                .hasStatus(HttpStatus.NOT_FOUND);
    }

    // Delete

    @Test
    void deletesAnUnusedType() {
        assertThat(mvc.delete().uri(BASE + "/" + projector.getId()))
                .hasStatus(HttpStatus.NO_CONTENT);

        assertThat(equipmentTypes.findById(projector.getId())).isEmpty();
    }

    @Test
    void refusesToDeleteATypeThatRoomsUse() {
        Room room = new Room("Aurora", 1, 6, "");
        room.update("Aurora", 1, 6, "", true, Set.of(projector), Set.of());
        rooms.saveAndFlush(room);

        assertThat(mvc.delete().uri(BASE + "/" + projector.getId()))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .isLenientlyEqualTo("""
                        { "detail": "Projector is still assigned to 1 room." }
                        """);
    }

    @Test
    void deletingAnUnknownTypeIs404() {
        assertThat(mvc.delete().uri(BASE + "/999999"))
                .hasStatus(HttpStatus.NOT_FOUND);
    }

    // Helpers

    private MockMvcRequestBuilder post(String uri, String json) {
        return mvc.post().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json);
    }

    private MockMvcRequestBuilder patch(String uri, String json) {
        return mvc.patch().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json);
    }
}