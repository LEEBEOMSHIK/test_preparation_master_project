package com.tpmp.testprep.config;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class InquirySchemaMigrationRunnerTest {

    @Test
    void removesOnlyLegacyInquiryTypeColumnAndPreservesRequestTypeDataAcrossRepeatedRuns() throws Exception {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(newDataSource());
        jdbcTemplate.execute("CREATE TABLE inquiries (id BIGINT PRIMARY KEY, inquiry_type VARCHAR(50) NOT NULL, request_type VARCHAR(50) NOT NULL)");
        jdbcTemplate.update("INSERT INTO inquiries (id, inquiry_type, request_type) VALUES (?, ?, ?)", 1L, "LEGACY_BUG", "BUG_REPORT");

        InquirySchemaMigrationRunner runner = new InquirySchemaMigrationRunner(jdbcTemplate);

        runner.run(null);
        runner.run(null);

        Integer legacyColumnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(TABLE_NAME) = 'inquiries' AND LOWER(COLUMN_NAME) = 'inquiry_type'",
                Integer.class
        );
        String requestType = jdbcTemplate.queryForObject(
                "SELECT request_type FROM inquiries WHERE id = ?",
                String.class,
                1L
        );

        assertThat(legacyColumnCount).isZero();
        assertThat(requestType).isEqualTo("BUG_REPORT");
    }

    @Test
    void skipsWhenLegacyColumnExistsOnlyInAnotherSchema() throws Exception {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(newDataSource());
        jdbcTemplate.execute("CREATE SCHEMA app_schema");
        jdbcTemplate.execute("CREATE SCHEMA legacy_schema");
        jdbcTemplate.execute("CREATE TABLE app_schema.inquiries (id BIGINT PRIMARY KEY, request_type VARCHAR(50) NOT NULL)");
        jdbcTemplate.execute("CREATE TABLE legacy_schema.inquiries (id BIGINT PRIMARY KEY, inquiry_type VARCHAR(50) NOT NULL, request_type VARCHAR(50) NOT NULL)");
        jdbcTemplate.execute("SET SCHEMA app_schema");

        InquirySchemaMigrationRunner runner = new InquirySchemaMigrationRunner(jdbcTemplate);

        runner.run(null);

        Integer legacyColumnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(TABLE_SCHEMA) = 'legacy_schema' AND LOWER(TABLE_NAME) = 'inquiries' AND LOWER(COLUMN_NAME) = 'inquiry_type'",
                Integer.class
        );
        Integer currentColumnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(TABLE_SCHEMA) = 'app_schema' AND LOWER(TABLE_NAME) = 'inquiries' AND LOWER(COLUMN_NAME) = 'inquiry_type'",
                Integer.class
        );

        assertThat(legacyColumnCount).isEqualTo(1);
        assertThat(currentColumnCount).isZero();
    }

    private DataSource newDataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.h2.Driver");
        dataSource.setUrl("jdbc:h2:mem:inquiry-schema-migration-" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1");
        dataSource.setUsername("sa");
        dataSource.setPassword("");
        return dataSource;
    }
}
