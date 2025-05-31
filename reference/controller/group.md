---
outline: deep
---

分组控制器，没有额外的控制逻辑，可用于分组或增加一层变量作用域等场景。

::: code-group

```yaml [Yaml 用例]
name: Group 用于分组或增加一层作用域（配置、前后置）
steps:
  - name: 用户 A 发送邮件
    group: 1   # group 为步骤关键字，其值无意义，不会被使用，值可以是任意类型的任意值
    steps:
      - name: 用户 A 登录
        noop: 1
      - name: 发送邮件 to B
        noop: 1
  - name: 用户 B 接收邮件
    group: 1
    steps:
      - name: 用户 B 登录
        noop: 1
      - name: 用户 B 查看邮件
        noop: 1
```

```java [Java 用例]
group("用户 A 发送邮件", () -> {
    System.out.println("用户 A 登录");
    System.out.println("发送邮件 to B");
});
group("用户 B 接收邮件", () -> {
    System.out.println("用户 B 登录");
    System.out.println("用户 B 查看邮件");
});
```

```groovy [Groovy 用例]
group("用户 A 发送邮件") {
    println "用户 A 登录"
    println "发送邮件 to B"
}
group("用户 B 接收邮件") {
    println "用户 B 登录"
    println "用户 B 查看邮件"
}
```

:::



