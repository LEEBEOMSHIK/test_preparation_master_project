package com.tpmp.testprep;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TestprepApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestprepApplication.class, args);
    }
}
