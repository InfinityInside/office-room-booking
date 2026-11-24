package io.github.infinityinside.roombooking.equipment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EquipmentTypeRepository extends JpaRepository<EquipmentType, Long> {

    List<EquipmentType> findAllByOrderByNameAsc();

    boolean existsByCode(String code);

    /** Case-insensitive, using the lower(name) index. */
    @Query("select count(t) > 0 from EquipmentType t where lower(t.name) = lower(:name)")
    boolean existsByNameIgnoringCase(String name);

    /** The same, but ignoring one type: renaming "projector" to "Projector" is not a conflict with itself. */
    @Query("select count(t) > 0 from EquipmentType t where lower(t.name) = lower(:name) and t.id <> :id")
    boolean existsByNameIgnoringCaseExcept(String name, Long id);

    /** How many rooms have this equipment. */
    @Query(value = "select count(*) from room_equipment where equipment_type_id = :id", nativeQuery = true)
    long countRoomsUsing(Long id);
}