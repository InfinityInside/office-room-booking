package io.github.infinityinside.roombooking.auth;

import io.github.infinityinside.roombooking.api.model.CurrentUserDto;
import io.github.infinityinside.roombooking.grant.AccessGrant;
import io.github.infinityinside.roombooking.user.AppUser;
import java.util.Comparator;
import java.util.List;

final class CurrentUserMapper {

    private CurrentUserMapper() {
    }

    static CurrentUserDto toDto(AppUser user) {
        List<AccessGrant> grants = user.getGrants().stream()
                .sorted(Comparator.comparing(AccessGrant::getId))
                .toList();
        return new CurrentUserDto()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .active(user.isActive())
                .grantIds(grants.stream().map(AccessGrant::getId).toList())
                .grantCodes(grants.stream().filter(AccessGrant::isActive).map(AccessGrant::getCode).toList());
    }
}