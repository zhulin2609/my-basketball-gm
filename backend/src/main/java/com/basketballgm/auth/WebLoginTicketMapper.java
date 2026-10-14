package com.basketballgm.auth;

import java.time.Instant;
import java.util.UUID;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface WebLoginTicketMapper {
  @Select("""
      insert into web_login_tickets (ticket_digest, browser_binding_digest, expires_at)
      values (#{ticketDigest}, #{browserBindingDigest}, #{expiresAt})
      returning id::text
      """)
  String insert(
      @Param("ticketDigest") String ticketDigest,
      @Param("browserBindingDigest") String browserBindingDigest,
      @Param("expiresAt") Instant expiresAt
  );

  @Select("""
      select id::text, browser_binding_digest as "browserBindingDigest", status,
             approved_user_id as "approvedUserId", created_at as "createdAt",
             expires_at as "expiresAt", resolved_at as "resolvedAt", consumed_at as "consumedAt"
      from web_login_tickets
      where ticket_digest = #{ticketDigest}
      """)
  WebLoginTicketRow findByDigest(@Param("ticketDigest") String ticketDigest);

  /** 状态转换前先取行锁：有效期与状态在取得锁后的实际时刻核验。 */
  @Select("""
      select id::text, browser_binding_digest as "browserBindingDigest", status,
             approved_user_id as "approvedUserId", created_at as "createdAt",
             expires_at as "expiresAt", resolved_at as "resolvedAt", consumed_at as "consumedAt"
      from web_login_tickets
      where ticket_digest = #{ticketDigest}
      for no key update
      """)
  WebLoginTicketRow findByDigestForUpdate(@Param("ticketDigest") String ticketDigest);

  @Select("""
      select count(*) from web_login_tickets
      where browser_binding_digest = #{browserBindingDigest} and created_at > #{since}
      """)
  int countRecentForBinding(
      @Param("browserBindingDigest") String browserBindingDigest,
      @Param("since") Instant since
  );

  @Update("""
      update web_login_tickets
      set status = 'approved', approved_user_id = #{userId}, resolved_at = now()
      where id = cast(#{id} as uuid) and status = 'pending'
        and expires_at > clock_timestamp()
      """)
  int approve(@Param("id") String id, @Param("userId") UUID userId);

  @Update("""
      update web_login_tickets
      set status = 'rejected', resolved_at = now()
      where id = cast(#{id} as uuid) and status = 'pending'
        and expires_at > clock_timestamp()
      """)
  int reject(@Param("id") String id);

  @Update("""
      update web_login_tickets
      set status = 'consumed', consumed_at = now()
      where id = cast(#{id} as uuid) and status = 'approved'
        and expires_at > clock_timestamp()
      """)
  int consume(@Param("id") String id);

  /** 阻塞式事务咨询锁；pg_advisory_xact_lock 返回 void，按文本读取后忽略。 */
  @Select("select pg_advisory_xact_lock(2026101401)")
  String acquireCreateLock();

  @Select("""
      select count(*) from web_login_tickets where created_at > #{since}
      """)
  int countRecentGlobal(@Param("since") Instant since);
}
