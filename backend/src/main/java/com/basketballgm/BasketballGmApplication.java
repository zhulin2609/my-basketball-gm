package com.basketballgm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BasketballGmApplication {

  public static void main(String[] args) {
    SpringApplication.run(BasketballGmApplication.class, args);
  }
}
