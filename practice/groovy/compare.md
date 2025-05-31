---
outline: deep
---

## 数据类型

### 字符串

| 对比项 | Java | Groovy |
| -- | -- | -- |
| 字符串字面量（双引号） | 字符串 | 插值字符串 |
| 字符串字面量（单引号） | 单个字符 | 普通字符串 |

```groovy
def value = "day day up"
println '${value}'.class    // class java.lang.String
println "${value}".class    // class org.codehaus.groovy.runtime.GStringImpl
```

`${sleep(10)}` 为 Groot 支持的表达式和函数。

```groovy
// 使用单引号，则 $ 不需要转义
def expression1 = '${sleep(10)}'
// 使用双引号，需要转义 $ 符号
def expression2 = "\${sleep(10)}"
// 当同时使用 Groovy 脚本中的变量和 Groot 的变量时，只能使用双引号，
// 同时转义 Groot 的 ${} 表达式，即：
def cnt = 5
def expression3 = "$cnt \${sleep(10)}"
```

## 变量访问

Groovy 闭包内有几种方式获得方法提示：

- `delegate.` 可以获得当前委托对象的方法提示
- `this.` 可以获得当前类对象的方法提示
- 直接写方法前几个字母，也可以获得匹配的方法提示

```groovy
class GroovyTestNGTest extends GrootTestNGTestCase {

    def xo = 1200

    @Test
    @GrootSupport
    public void test1() {
	    // 方法内可以访问成员变量，这个没什么好说的
        def x1 = xo

        foreachWith("yy") {
	        // DELEGATE_ONLY 策略闭包内可以访问方法内的局部变量，这个是闭包的特性
	        // 这里的 x1 不是挂载在 delegate 上的，是闭包对象的属性
            println x1
            
            // ❌ 编译错误，DELEGATE_ONLY 策略闭包内无法访问成员变量
            // println xo
            // ✅ 正确写法，这里的 this 指向 GroovyTestNGTest 对象
            println this.xo
        
            forSettings {
                file 'data/test.csv'
                filter {
                    slice("[1..-1]").condition(' ${username} == "tomcat"')
                }
            }
            setupBefore {
                def x2 = x1
                println x2
                apply {
                    println "setupBefore " + x1
                }
            }
        }
    }

}
```

