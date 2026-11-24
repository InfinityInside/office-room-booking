package io.github.infinityinside.roombooking.equipment;

import io.github.infinityinside.roombooking.api.EquipmentTypesApi;
import io.github.infinityinside.roombooking.api.model.EquipmentTypeDto;
import java.util.List;

import io.github.infinityinside.roombooking.api.model.EquipmentTypeInputDto;
import io.github.infinityinside.roombooking.api.model.EquipmentTypeRenameDto;
import org.springframework.http.HttpStatus;
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

    @Override
    public ResponseEntity<EquipmentTypeDto> createEquipmentType(EquipmentTypeInputDto input) {
        EquipmentType created = service.create(input.getCode(), input.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
    }

    @Override
    public ResponseEntity<EquipmentTypeDto> renameEquipmentType(Long equipmentTypeId, EquipmentTypeRenameDto rename) {
        return ResponseEntity.ok(toDto(service.rename(equipmentTypeId, rename.getName())));
    }

    @Override
    public ResponseEntity<Void> deleteEquipmentType(Long equipmentTypeId) {
        service.delete(equipmentTypeId);
        return ResponseEntity.noContent().build();
    }

    static EquipmentTypeDto toDto(EquipmentType type) {
        return new EquipmentTypeDto(type.getId(), type.getCode(), type.getName());
    }
}