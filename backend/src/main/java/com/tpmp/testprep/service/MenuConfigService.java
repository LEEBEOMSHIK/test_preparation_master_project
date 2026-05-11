package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.MenuConfigRequest;
import com.tpmp.testprep.dto.response.MenuConfigResponse;
import com.tpmp.testprep.entity.MenuConfig;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.MenuConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuConfigService {

    private final MenuConfigRepository menuConfigRepository;

    public List<MenuConfigResponse> getMenuTree(MenuConfig.MenuType menuType, boolean activeOnly) {
        List<MenuConfig> menus = activeOnly
                ? menuConfigRepository.findByMenuTypeAndIsActiveOrderByDisplayOrderAsc(menuType, true)
                : menuConfigRepository.findByMenuTypeOrderByDisplayOrderAsc(menuType);

        // Build tree: top-level first, then attach children
        Map<Long, List<MenuConfig>> childMap = menus.stream()
                .filter(m -> m.getParentId() != null)
                .collect(Collectors.groupingBy(MenuConfig::getParentId));

        return menus.stream()
                .filter(m -> m.getParentId() == null)
                .map(m -> MenuConfigResponse.withChildren(
                        m,
                        childMap.getOrDefault(m.getId(), List.of())
                                .stream().map(MenuConfigResponse::from).toList()
                ))
                .toList();
    }

    public List<MenuConfigResponse> getAllFlat(MenuConfig.MenuType menuType) {
        return menuConfigRepository.findByMenuTypeOrderByDisplayOrderAsc(menuType)
                .stream().map(MenuConfigResponse::from).toList();
    }

    @Transactional
    public MenuConfigResponse create(MenuConfigRequest request) {
        MenuConfig menu = MenuConfig.builder()
                .parentId(request.parentId())
                .name(request.name())
                .url(request.url())
                .iconKey(request.iconKey())
                .displayOrder(request.displayOrder())
                .menuType(request.menuType())
                .isActive(request.isActive())
                .allowedRoles(request.allowedRoles())
                .build();
        return MenuConfigResponse.from(menuConfigRepository.save(menu));
    }

    @Transactional
    public MenuConfigResponse update(Long id, MenuConfigRequest request) {
        MenuConfig menu = findMenu(id);
        menu.update(request.parentId(), request.name(), request.url(), request.iconKey(),
                request.displayOrder(), request.isActive(), request.allowedRoles());
        return MenuConfigResponse.from(menu);
    }

    @Transactional
    public void delete(Long id) {
        menuConfigRepository.delete(findMenu(id));
    }

    /**
     * 권한 코드 집합 기반 메뉴 트리 반환.
     * - ADMIN 타입 + 권한 없음 → 전체 반환 (슈퍼 어드민 폴백)
     * - USER 타입 + 권한 없음  → PUBLIC 메뉴만 반환 (1:1 문의 등 항상 접근 가능한 메뉴)
     * - 권한 있음              → 매칭 메뉴 + PUBLIC 메뉴 반환
     */
    public List<MenuConfigResponse> getMenuTreeByPermissions(MenuConfig.MenuType menuType, Set<String> codes) {
        List<MenuConfig> menus = menuConfigRepository
                .findByMenuTypeAndIsActiveOrderByDisplayOrderAsc(menuType, true);

        List<MenuConfig> filtered;
        if (codes.isEmpty()) {
            if (MenuConfig.MenuType.ADMIN.equals(menuType)) {
                // 관리자 권한 없으면 전체 표시 (슈퍼 어드민 폴백)
                filtered = menus;
            } else {
                // 사용자 권한 없으면 PUBLIC 메뉴만 표시
                filtered = menus.stream()
                        .filter(m -> containsRole(m.getAllowedRoles(), "PUBLIC"))
                        .toList();
            }
        } else {
            // 권한 있으면: 권한 코드 매칭 메뉴 + PUBLIC 메뉴 포함
            filtered = menus.stream()
                    .filter(m -> containsRole(m.getAllowedRoles(), "PUBLIC") ||
                                 codes.stream().anyMatch(c -> containsRole(m.getAllowedRoles(), c)))
                    .toList();
        }

        Map<Long, List<MenuConfig>> childMap = filtered.stream()
                .filter(m -> m.getParentId() != null)
                .collect(Collectors.groupingBy(MenuConfig::getParentId));

        return filtered.stream()
                .filter(m -> m.getParentId() == null)
                .map(m -> MenuConfigResponse.withChildren(
                        m,
                        childMap.getOrDefault(m.getId(), List.of())
                                .stream().map(MenuConfigResponse::from).toList()))
                .toList();
    }

    /** 특정 권한 코드가 allowedRoles에 포함된 메뉴 ID 목록을 반환 */
    public List<Long> getMenuIdsByPermissionCode(String code) {
        return menuConfigRepository.findAll().stream()
                .filter(m -> containsRole(m.getAllowedRoles(), code))
                .map(MenuConfig::getId)
                .toList();
    }

    /** 특정 권한 코드의 메뉴 접근 권한을 menuIds 목록으로 일괄 교체 */
    @Transactional
    public void updatePermissionMenus(String permCode, List<Long> menuIds) {
        List<MenuConfig> all = menuConfigRepository.findAll();
        for (MenuConfig menu : all) {
            boolean shouldHave = menuIds != null && menuIds.contains(menu.getId());
            boolean hasNow = containsRole(menu.getAllowedRoles(), permCode);
            if (shouldHave == hasNow) continue;

            String updated = shouldHave
                    ? addRole(menu.getAllowedRoles(), permCode)
                    : removeRole(menu.getAllowedRoles(), permCode);
            menu.update(menu.getParentId(), menu.getName(), menu.getUrl(),
                    menu.getIconKey(), menu.getDisplayOrder(), menu.isActive(), updated);
        }
    }

    private boolean containsRole(String allowedRoles, String code) {
        if (allowedRoles == null || allowedRoles.isBlank()) return false;
        return Arrays.stream(allowedRoles.split(","))
                .map(String::trim).anyMatch(code::equals);
    }

    private String addRole(String allowedRoles, String code) {
        if (allowedRoles == null || allowedRoles.isBlank()) return code;
        return allowedRoles + "," + code;
    }

    private String removeRole(String allowedRoles, String code) {
        if (allowedRoles == null) return null;
        String result = Arrays.stream(allowedRoles.split(","))
                .map(String::trim).filter(r -> !r.equals(code))
                .collect(Collectors.joining(","));
        return result.isBlank() ? "" : result;
    }

    private MenuConfig findMenu(Long id) {
        return menuConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }
}
