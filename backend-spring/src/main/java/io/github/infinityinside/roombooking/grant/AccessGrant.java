package io.github.infinityinside.roombooking.grant;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "access_grant")
public class AccessGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String name;

    @Enumerated(EnumType.STRING)
    private GrantType type;

    private String description;
    private boolean active;

    /** For JPA only. */
    protected AccessGrant() {
    }

    public AccessGrant(String code, String name, GrantType type, String description) {
        this.code = code;
        this.name = name;
        this.type = type;
        this.description = description;
        this.active = true;
    }

    public void rename(String name) {
        this.name = name;
    }

    public void changeDescription(String description) {
        this.description = description;
    }

    public void setActive(boolean active) {
        if (!active && type == GrantType.SYSTEM) {
            throw new IllegalStateException("System grants cannot be deactivated.");
        }
        this.active = active;
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

    public GrantType getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }
}