---
outline: deep
---

条件控制器与代码中的 if 控制语句相同，对应的类为 IfController。

if 属性的计算结果必须是 true/false 字符串，或者 toString() 结果为 true/false 的对象。

::: code-group

```csv [data.csv]
role,username,password
admin,admin,admin
guest,g1,g1pw
guest,g2,g2pw
```

```yaml [Yaml 用例]
name: If 控制器示例
steps:
  - name: 多个账号数据
    for:
      file: testcases/controller/if/data.csv
    steps:
      - name: 登录后台管理系统
        if: ${role == 'admin'}
        steps:
          - name: '管理员 ${username} 登录后台'
            noop: 1

      - name: 登录前台页面
        if: ${role == 'guest'}
        steps:
          - name: '用户 ${username} 登录前台'
            noop: 1
```

```java [Java 用例]
foreach("多个账号数据", "testcases/controller/if/data.csv", () -> {
    onIf("登录后台管理系统", "${role == 'admin'}", () -> {
        System.out.println(evalAsString("管理员 ${username} 登录后台"));
    });
    onIf("登录前台页面", "${role == 'guest'}", () -> {
        System.out.println(evalAsString("用户 ${username} 登录前台"));
    });
});
```

```groovy [Groovy 用例]
foreach("多个账号数据", "testcases/controller/if/data.csv") {
    onIf("登录后台管理系统", '${role == "admin"}') {
        System.out.println(evalAsString('管理员 ${username} 登录后台'));
    }
    onIf("登录前台页面", '${role == "guest"}') {
        System.out.println(evalAsString('用户 ${username} 登录前台'));
    }
}
```

:::





