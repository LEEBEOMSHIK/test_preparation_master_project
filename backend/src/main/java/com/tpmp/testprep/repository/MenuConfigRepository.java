package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.MenuConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuConfigRepository extends JpaRepository<MenuConfig, Long> {
    List<MenuConfig> findByMenuTypeOrderByDisplayOrderAsc(MenuConfig.MenuType menuType);
    List<MenuConfig> findByMenuTypeAndIsActiveOrderByDisplayOrderAsc(MenuConfig.MenuType menuType, boolean isActive);
    boolean existsByUrl(String url);
}
