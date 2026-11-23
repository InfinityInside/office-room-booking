package io.github.infinityinside.roombooking.equipment;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "equipment_type")
public class EquipmentType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String name;

    /** For JPA only. */
    protected EquipmentType() {
    }

    public EquipmentType(String code, String name) {
        this.code = code;
        this.name = name;
    }

    /** Only the display name can change; the code is permanent. */
    public void rename(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }
}