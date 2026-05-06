package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserInterestedExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserInterestedExamRepository extends JpaRepository<UserInterestedExam, Long> {
    List<UserInterestedExam> findByUser(User user);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserInterestedExam e WHERE e.user = :user")
    void deleteByUser(@Param("user") User user);
}
