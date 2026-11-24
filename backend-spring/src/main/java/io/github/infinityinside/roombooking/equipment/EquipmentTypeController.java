package io.github.infinityinside.roombooking.equipment;

import io.github.infinityinside.roombooking.api.EquipmentTypesApi;
import io.github.infinityinside.roombooking.api.model.EquipmentTypeDto;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
class EquipmentTypeController implements EquipmentTypesApi {

    private final EquipmentTypeService service;

    EquipmentTypeController(EquipmentTypeService service) {
        this.service = service;
    }

    @Override
    public ResponseEntity<List<EquipmentTypeDto>> listEquipmentTypes() {
        List<EquipmentTypeDto> body = service.listAll().stream()
                .map(EquipmentTypeController::toDto)
                .toList();
        return ResponseEntity.ok(body);
    }

    static EquipmentTypeDto toDto(EquipmentType type) {
        return new EquipmentTypeDto(type.getId(), type.getCode(), type.getName());
    }
}