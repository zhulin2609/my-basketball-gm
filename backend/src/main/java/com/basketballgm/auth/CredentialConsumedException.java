package com.basketballgm.auth;

/** 凭证在同一事务中插入身份成功、但消费时发现已被并发完成；由冲突消解按幂等处理。 */
class CredentialConsumedException extends RuntimeException {}
