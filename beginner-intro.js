'use strict';
// Original Chinese notes. W3 remains the primary textbook, not a copied translation.
const beginnerIntro=[];
function chapter(title,path,body,code,output,tasks=[]){
 beginnerIntro.push({title,source:'w3chapter'+beginnerIntro.length,url:'https://www.w3schools.com/python/'+path,body:body+(tasks.length?'<h3>补充练习（本站编写）</h3><ol>'+tasks.map(t=>'<li>'+t+'</li>').join('')+'</ol>':''),code,output});
}
chapter('Python Intro · Python是什么','python_intro.asp','<p>Python是一种编程语言，可以用于数据分析、自动化和应用开发。先在W3阅读介绍，再在App运行小例子；不需要现在就学变量或Pandas。</p>');
chapter('Python Get Started · 开始运行','python_getstarted.asp','<p>W3介绍安装、运行文件和命令行。App已附带Python环境，可以直接在右侧写代码并运行；运行入口不同，不代表已经掌握环境安装。</p>','print("开始学习Python")','开始学习Python\n');
chapter('Python Syntax · 语法','python_syntax.asp','<p>代码遵守语法规则，Python区分大小写。缩进表示代码块；先在W3看缩进示例，不要求提前编写条件判断。普通顶层语句前不要随意加空格。</p>','print("检查英文括号和引号")','检查英文括号和引号\n');
chapter('Python Syntax / Statements · 语句','python_statements.asp','<p>一条语句表达一步操作；先一行写一句。普通语句末尾不需要像SQL一样加分号。多条语句通常从上到下执行。</p>','print("第一步")\nprint("第二步")','第一步\n第二步\n');
chapter('Python Output / Print Text · 输出文字','python_output.asp',`<p class="goal">你目前学到这里。先学输出，不提前要求变量、客单价或f字符串。</p><h3>1. print()把内容显示出来</h3><p><code>print</code>是Python提供的函数，可以先理解为一个现成工具。括号里放要显示的内容；这里的“打印”指显示到结果区。</p><h3>2. 文字要用成对引号</h3><p>英文单引号和双引号都可以，前后必须配对。引号标识文字的范围，通常不会显示在结果中。<code>Print</code>不是<code>print</code>；漏引号、漏括号可能报错。</p><h3>3. 默认每次输出后换行</h3><p>连续写两条print，默认显示为两行。代码中的引号与括号使用英文符号，文字内容可以是中文。</p><h3>4. end控制输出结尾</h3><p>默认结尾是换行。写<code>end=" "</code>，会把换行换成一个空格，下一次输出接在同一行。写<code>end=""</code>则连空格也不加。此处先理解用途，不提前展开函数参数课程。</p><table><tr><th>写法</th><th>效果</th></tr><tr><td>print("开始")</td><td>输出后换行</td></tr><tr><td>print("开始", end=" ")</td><td>输出后加空格，不换行</td></tr><tr><td>print("开始", end="")</td><td>输出后不加字符，不换行</td></tr></table><p>下方例子最后一行来自连续两次print。左侧“直接运行”不会覆盖右侧原草稿。</p>`, 'print("我在学Python")\nprint(\'先学输出\')\nprint("今日任务：", end=" ")\nprint("练习print")','我在学Python\n先学输出\n今日任务： 练习print\n',['用两条print分别输出“开始学习”和“Python Output”，结果占两行。','仍用两条print，把“今日学习”和“输出”显示在同一行，中间有一个空格。','解释上题的end=" "和end=""有什么区别。']);
chapter('Python Output / Print Numbers · 输出数字','python_output_numbers.asp','<p>数字不加引号时按数值处理。print括号中可以直接计算；加引号则变为文字。<code>print(6 + 4)</code>输出10，<code>print("6 + 4")</code>原样输出表达式。</p><p>文字与数字可以用逗号分开传给print，默认在各项间加空格。现在不需要变量，也不需要f字符串。</p>','print(12)\nprint(6 + 4)\nprint("6 + 4")\nprint("订单数", 12)','12\n10\n6 + 4\n订单数 12\n',['直接显示数字18，再显示18加2的计算结果。','用一条print显示“浏览次数 120”，文字与数字用逗号分隔。']);
chapter('Python Comments · 注释','python_comments.asp','<p><code>#</code>后面的内容是注释，用于解释代码，不作为指令执行。可以独占一行，也可以放在语句后。多行说明可逐行加#；三引号首先是字符串写法，并不是专用注释语法。</p>','# 显示当前学习主题\nprint("输出复习")','输出复习\n',['给你上一页的输出代码加一句说明性注释，再运行确认输出没变。']);
chapter('Python Variables · 变量','python_variables.asp','<p>学完Output和Comments，再给数值起名字。<code>=</code>把右边的值赋给左边名称，不是在判断相等。先在W3学习创建变量、大小写和类型的基本说明，再做业务计算。</p>','sales = 480\norders = 8\nprint(sales / orders)','60.0\n',['把收入改成520、订单数保持8，显示平均每单收入；这是补充业务练习。']);
// Reading guides follow W3 order; subchapters remain available in the textbook.
const route=[
 ['Python Data Types · 数据类型','python_datatypes.asp','认识不同类型和type()，不要把带引号的数字直接当作数值。'],
 ['Python Numbers · 数字','python_numbers.asp','认识int、float、complex和数值转换，优先练整数与小数。'],
 ['Python Casting · 类型转换','python_casting.asp','理解int、float、str的转换，以及输入不合适时的报错。'],
 ['Python Strings · 字符串','python_strings.asp','按子目录学习索引、切片、修改、拼接、格式化、转义和方法。'],
 ['Python Booleans · 布尔值','python_booleans.asp','理解True、False与条件判断结果。'],
 ['Python Operators · 运算符','python_operators.asp','按子目录学习算术、赋值、比较和逻辑等运算符，区分=与==。'],
 ['Python Lists · 列表','python_lists.asp','按子目录学习访问、修改、增删、遍历、排序和复制。'],
 ['Python Tuples · 元组','python_tuples.asp','对比列表与元组，学习访问、解包和遍历。'],
 ['Python Sets · 集合','python_sets.asp','理解去重、成员判断及集合运算，不把集合当作有固定下标的列表。'],
 ['Python Dictionaries · 字典','python_dictionaries.asp','理解键值对应，按子目录学习访问、更新、遍历及嵌套。'],
 ['Python If...Else · 条件判断','python_conditions.asp','学习if、elif、else与缩进，使用小数据检查边界。'],
 ['Python Match · 模式匹配','python_match.asp','学习match/case，运行前注意Python版本支持。'],
 ['Python While Loops · while循环','python_while_loops.asp','先看循环条件如何变化，避免无限循环，再学习break和continue。'],
 ['Python For Loops · for循环','python_for_loops.asp','理解逐项遍历，继续学习range、break、continue及嵌套。'],
 ['Python Functions · 函数','python_functions.asp','按子目录学习定义、参数和返回值，其余子主题逐步推进。'],
 ['Python Range · 数值序列','python_range.asp','理解起点、终点不包含和步长，和循环配合练习。'],
 ['Python Arrays · 数组','python_arrays.asp','不把普通列表与NumPy数组混为一谈。'],
 ['Python Iterators · 迭代器','python_iterators.asp','理解iter和next的逐次取值，再看自定义迭代器。'],
 ['Python Modules · 模块','python_modules.asp','理解import及模块名称，再学习组织自己的代码。'],
 ['Python Dates · 日期','python_datetime.asp','认识datetime，再进行日期处理；不要直接套用SQL日期函数。'],
 ['Python Math · 数学','python_math.asp','练习内置计算工具与math模块。'],
 ['Python JSON · JSON','python_json.asp','理解JSON文本与Python对象的转换。'],
 ['Python RegEx · 正则表达式','python_regex.asp','先理解简单的匹配用途，再逐步练模式。'],
 ['Python PIP · 包管理','python_pip.asp','认识第三方包；App附带环境与系统Python要区分。'],
 ['Python Try...Except · 异常处理','python_try_except.asp','先读懂报错，再捕获明确的异常，不静默忽略所有失败。'],
 ['Python String Formatting · 字符串格式化','python_string_formatting.asp','整理格式化写法，再用于业务结果展示。']
];
for(const [title,path,note]of route)chapter(title,path,'<p>'+note+'</p><p>本页为阅读导引。请打开对应W3章节，依照页面及其子目录学习和运行示例；这里不声称已经完整翻译该章，也不自动标记学完。业务课程仅作补充，不替代基础章节。</p>');
if(typeof window!=='undefined')window.ATLAS_BEGINNER_INTRO=beginnerIntro;else module.exports=beginnerIntro;
