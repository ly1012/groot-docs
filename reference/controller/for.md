---
outline: deep
---

参数化控制器即 For 控制器，对应的类为 ForEachController。参数化控制器读取数据源，每次使用其中一条数据执行子步骤集合，直到执行完所有符合条件的数据。

参数化控制器的数据源支持字面量、表达式或文件，过滤器则用于用例调试、数据过滤筛选等目的。

## 数据源形式

### 字面量数据

- **表格形式（仅配置风格可用）**  
  table 属性表示使用表格形式的字面量写法。  
  第一行为表格的表头，即参数数据的列名，第二行及之后的行表示与表头对齐的数据行。
- **行形式（仅配置风格可用）**  
  row 属性表示使用行形式的字面量写法。  
  每一行的字段名表示列名，字段值表示列的值。
- **列形式（仅配置风格可用）**   
  column 属性表示使用列形式的字面量写法。  
  下面的 name、comment 表示列名，其后为该列的值集合，即第 1/2/3 行的值。每列的值行数必须相同。
- **对象形式（仅代码风格可用）**  
  直接传递一个包含参数化数据的对象，对象类型必须为 `List<Map<String, Object>>`。

::: code-group

```yaml [表格形式]
name: ForEachController 表格模式写法示例
steps:
  - name: 表格形式的数据字面量
    for:
      table:
        - [name, comment]
        - [cat, HelloKitty]
        - [dog, Snoopy]
    steps:
      - name: 如果是 cat
        if: ${name == 'cat'}
        steps:
          - name: 变量值断言
            group: true
            validate:
              - equalTo: ["${comment}", "HelloKitty"]
```

```yaml [行形式]
name: ForEachController 行模式写法示例
steps:
  - name: 行形式的数据字面量
    for:
      row:
        - name: cat
          comment: HelloKitty
        - name: dog
          comment: Snoopy
    steps:
      - name: 如果是 cat
        if: ${name == 'cat'}
        steps:
          - name: 变量值断言
            group: true
            validate:
              - equalTo: ["${comment}", "HelloKitty"]
```

```yaml [列形式]
name: ForEachController 列模式写法示例
steps:
  - name: 列形式的数据字面量
    for:
      column:
        name: ["cat", "dog"]
        comment: ["HelloKitty", "Snoopy"]
    steps:
      - name: 如果是 cat
        if: ${name == 'cat'}
        steps:
          - name: 变量值断言
            group: true
            validate:
              - equalTo: ["${comment}", "HelloKitty"]
```

```java [对象形式]
sv("grootPwd", "grootPassword");

List<Map<String, Object>> data = List.of(
    Map.of("username", "admin", "password", "admin123"),
    Map.of("username", "guest", "password", "guest123"),
    Map.of("username", "groot", "password", "${grootPwd}")
);
Ref<Integer> count = ref(0);
foreach("使用 3 个不同权限的账号操作", data, () -> {
    count.value++;
    if (count.value == 3) {
        String username = lv("username");
        String password = lv("password");
        assertThat(username).isEqualTo("groot");
        assertThat(password).isEqualTo("grootPassword");
    }
});
assertThat(count.value).isEqualTo(3);
```

:::



### 表达式数据

expression 属性表示使用表达式返回的值作为参数化数据源，约定表达式返回 `List<Map<String, Object>>` 类型的对象。

::: code-group 

```yaml [Yaml 用例]
name: ForEachController 表达式模式写法示例
variables:
  data:
    - name: cat
      comment: HelloKitty
    - name: dog
      comment: Snoopy
steps:
  - name: 使用表达式返回的数据
    for:
      expression: ${data}
    steps:
      - name: 如果是 cat
        if: ${name == 'cat'}
        steps:
          - name: 变量值断言
            group: true
            validate:
              - equalTo: ["${comment}", "HelloKitty"]
```

```java [Java 用例]
List<Map<String, Object>> data = List.of(
    Map.of("name", "cat", "comment", "HelloKitty"),
    Map.of("name", "dog", "comment", "Snoopy")
);
sv("data", data);
foreach("使用表达式返回的数据", settings -> settings.expression("${data}"), () -> {

    onIf("如果是猫", "${name == 'cat'}", () -> {
        assertThat((String)v("comment")).isEqualTo("HelloKitty");
    });

});
```

```groovy [Groovy 用例]
def data = [
    [name: "cat", comment: "HelloKitty"],
    [name: "dog", comment: "Snoopy"]
]
sv("data", data)
foreach("使用表达式返回的数据", { expression('${data}') }) {

    onIf("如果是猫", '${name == "cat"}') {
        assertThat((String) v("comment")).isEqualTo("HelloKitty")
    }

}
```

:::

### 文件数据

file 属性表示从文件中读取参数化数据，当前支持 yaml/json/csv/xls/xlsx 文件。

::: code-group

```yaml [Yaml 用例]
name: ForEachController 文件模式写法示例模板
steps:
  - name: 参数化文件
    for:
      file: testcases/controller/foreach/data3.csv
    steps:
      - name: 如果是 cat
        if: ${name == 'cat'}
        steps:
          - name: 变量值断言
            group: true
            validate:
              - equalTo: ["${comment}", "HelloKitty"]
```

```java [Java 用例]
Ref<Integer> count = ref(0);
foreach("使用 3 个不同权限的账号操作", "testdata/testelement/foreach/user.csv", () -> {
    count.value++;
    if (count.value == 3) {
        String username = lv("username");
        String password = lv("password");
        assertThat(username).isEqualTo("groot");
        assertThat(password).isEqualTo("grootPassword");
    }
});
assertThat(count.value).isEqualTo(3);
```

```groovy [Groovy 用例]
int count
foreach("使用 3 个不同权限的账号操作", "testdata/testelement/foreach/user.csv") {
    count++
    if (count == 3) {
        String username = lv("username")
        String password = lv("password")
        assertThat(username).isEqualTo("groot")
        assertThat(password).isEqualTo("grootPassword")
    }
}
assertThat(count).isEqualTo(3)
```

:::

CSV 文件路径说明：

- `data.csv?format=MySQL` 表示使用 `CSVFormat.Predefined.MySQL` 格式读取 CSV 文件。
- `data.csv?delimiter=,&escape=\&quote="` 指定读取 CSV 文件时的格式。
  - delimiter 分隔符，单个字符
  - escape 转义字符，单个字符
  - quote 包裹值的字符，单个字符
  - ignoreSurroundingSpaces 忽略左右两边的空格，true/false

CSV 文件（MySQL 格式）内容示例：

```csv
name	comment
cat	HelloKitty
dog	{"data": "dd\\"d"}
```

Excel 文件路径说明：

- `data.xlsx?index=2` 表示读取 Excel 文件的第二个 Sheet（1-based）。
- `data.xlsx?name=用户数据` 表示读取 Excel 文件名称为 “用户数据” 的 Sheet。

## 过滤器

有时我们不需要数据源中的全部数据，但又不想将非必要数据删除，或者临时需要筛选部分数据来进行参数化，或者临时选择一行失败的数据调试用例。

这时可以使用过滤器属性，当前支持 names 过滤列，slice 和 condition 过滤行。

::: code-group

```csv [data_filter.csv]
role, username, password, comment
guest, tom, guest666, 游客账号
admin, admin, admin123, 管理员账号
guest, jim, guest123, 游客账号
superadmin, superadmin, super@3#899=, 超级管理员账号
guest, tom, guest999, 游客账号
```

```yaml [Yaml 用例]
name: ForEachController 过滤器示例
steps:
  - name: 过滤行数据和列数据
    for:
      file: data_filter.csv?ignoreSurroundingSpaces=true
      filter:
        # 过滤列：参数化数据仅包含以下列
        names: [role, username, password]
        # 过滤行：参数化数据仅包含以下行（1-based），注意值为字符串
        # [1..3]
        # [1..]
        # [..4]
        # [1, 2, 3]
        # [1, 3, -4, -1]
        slice: "[2..-1]"
        # 过滤行：参数化数据仅包含符合以下条件的行
        condition: ${role == 'guest' && username == 'tom'}
    steps:
      - name: 变量断言
        noop: 1
        validate:
          - equalTo: ['${password}', 'guest999']
          - equalTo: ['${comment}', null]
```

```java [Java 用例]
Ref<Integer> count = ref(0);
foreach("ForEachController 过滤器示例", it -> it
    .file("data_filter.csv?ignoreSurroundingSpaces=true")
    .filter(filter -> filter
        .slice("[2..-1]")
        .condition("${role == 'guest' && username == 'tom'}")
        .names("role", "username", "password")), () ->
{
    noopWith("变量值断言", action -> action
        .validate(validate -> validate
            .equalTo("${password}", "guest999")
            .equalTo("${comment}", null)));
    count.value++;
});
assertThat(count.value).isEqualTo(1);
```

```groovy [Groovy 用例]
int count
foreach("ForEachController 过滤器示例", {
    file "data_filter.csv?ignoreSurroundingSpaces=true"
    filter { 
        slice "[2..-1]" 
        condition '${role == "guest" && username == "tom"}'
        names "role", "username", "password"
    }
}) {
    noopWith("变量值断言") {
        validate {
            equalTo '${password}', "guest999"
            equalTo '${comment}', null
        }
    }
    count++
}
assertThat(count).isEqualTo(1)
```

```groovy [Groovy 用例2]
// GroovySupport.defClosure 是创建闭包的辅助方法，
// 默认直接定义闭包时，IDEA 无法自动提示 delegate 对象的方法

int count
def forSettings = defClosure(ForEachController.ForSettings.Builder.class) {
    file "data_filter.csv?ignoreSurroundingSpaces=true"
    filter {
        slice "[2..-1]"
        condition '${role == "guest" && username == "tom"}'
        names "role", "username", "password"
    }
}
foreach("ForEachController 过滤器示例", forSettings) {
    noopWith("变量值断言") {
        validate {
            equalTo '${password}', "guest999"
            equalTo '${comment}', null
        }
    }
    count++
}
assertThat(count).isEqualTo(1)
```


:::
