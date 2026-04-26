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

import java.util.List;
import java.util.Map;
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

    private MenuConfig findMenu(Long id) {
        return menuConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }
}
