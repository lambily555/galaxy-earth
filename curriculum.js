'use strict';
// 6 regions × (6 learning/practice units + 1 checkpoint) = 42 daily units.
const regions=[
 {name:'启程之地',topic:'Python必要基础',place:'北美洲',center:[250,220],outcome:'读懂代码，写出简单的业务计算'},
 {name:'表格群岛',topic:'Pandas与文件',place:'南美洲',center:[360,440],outcome:'读入表格，筛选、排序并导出'},
 {name:'清洗山脉',topic:'数据质量',place:'欧洲',center:[650,190],outcome:'处理缺失、重复、类型与日期'},
 {name:'汇总原野',topic:'分组与连接',place:'非洲',center:[650,390],outcome:'正确汇总多张表，不重复算钱'},
 {name:'洞察大陆',topic:'指标与图表',place:'亚洲',center:[900,240],outcome:'解释业务指标，制作清晰图表'},
 {name:'交付海岸',topic:'自动化与作品',place:'大洋洲',center:[1040,475],outcome:'把分析流程整理成可重复交付的作品'}
];
const courseRows=[
['变量与业务计算','给数值起名，再计算客单价。','变量是指向一个值的名称；赋值语句将右边计算的结果绑定给左边的名字。','把变量看成一张标签。total_sales贴在销售额上，下次用标签就能拿到这个数。=是赋值，不是提问相不相等。',`total_sales = 360
order_count = 5
average_order = total_sales / order_count
print(average_order)`,['某游戏收入480元、付费订单8笔，用三个变量计算并打印平均每单收入。','把收入改成520重新运行，用自己的话说明=和/分别做什么。']],
['数字、文字与显示','分清可计算的数与用于展示的文字。','int表示整数，float表示带小数的数字，str表示字符串；print是显示结果的内置函数。','引号里的120是文字，不是能直接加钱的数。先算数，再用f字符串把标签和结果显示在一起。',`sales = 120.5
channel = 'Social_A'
print(type(sales).__name__)
print(f'{channel}收入：{sales:.2f}元')`,['用数字变量保存订单数3、销售额99.9，显示“平均每单：33.30元”。','比较print(120 + 30)与print("120" + "30")的结果并解释。']],
['列表与字典','保存多条金额和一条客户信息。','list是有顺序的值集合；dict保存键和值的对应关系。','列表像一列订单金额，字典像一张带列名的客户卡。下标从0开始，字典通过键名取内容。',`amounts = [100, 80, 60]
customer = {'name': '林杉', 'channel': 'A'}
print(amounts[0])
print(sum(amounts))
print(customer['channel'])`,['建立[50, 90, 110]列表，打印订单数、总额、第一笔金额。','用字典保存一个游戏的名称和运行次数，按键取出并打印。']],
['条件判断与分层','按金额给客户分类。','if/elif/else根据布尔条件选择要执行的代码块；缩进标识代码块范围。','像SQL CASE，从上到下试条件，第一个成立就执行。>=是比较，=是存值。',`spend = 180
if spend >= 150:
    level = 'High'
elif spend >= 80:
    level = 'Medium'
else:
    level = 'Low'
print(level)`,['对金额75、80、150分别试运行，验证边界标签。','先用if判断订单数是否为0，避免平均单价除以0；0时打印“无订单”。']],
['循环与记录筛选','逐条检查记录，保留需要的数据。','for按顺序遍历可迭代对象，对其中每一项执行代码块。','for就是从一叠订单中依次拿出一张。循环不必用来替代所有Pandas操作，先理解执行过程。',`amounts = [100, 0, 60]
positive = []
for amount in amounts:
    if amount > 0:
        positive.append(amount)
print(positive)`,['遍历[30, 90, 0, 120]，收集>=80的金额。','不要删掉0元订单：分别计算全部订单数与正金额订单数，解释区别。']],
['函数、导入与读报错','把重复计算封装起来。','def定义函数，参数是输入，return给出返回值；import导入模块。','函数像一个可重复使用的计算步骤。报错先看最后一行，再找自己的代码行号，不必整段全重写。',`def average(sales, orders):
    if orders == 0:
        return None
    return round(sales / orders, 2)

print(average(250, 3))
print(average(0, 0))`,['编写growth(current, previous)函数，上期为0返回None，否则返回两位百分数。','故意把变量名拼错一次，记录NameError指向哪里；修好后保留说明。']],
['基础营地测试','独立组合变量、条件、循环和函数。','阶段测试是独立完成小任务，检验能否解释输入、处理和输出。','今天不学新语法。先独立尝试，查笔记后注明帮助；运行成功不等于理解。',`# 阶段测试：在下面写你的代码。
# 可查前六个单元，但请记录查阅情况。`,['给定[120, 0, 80, 100]，输出订单数、金额、平均单价。','写一个函数，输入金额返回High/Medium/Low，边界自定并写清。','用循环找出High订单，解释0元订单是否仍计入订单数。']],
['认识DataFrame','把记录变成有行列的表。','DataFrame是Pandas的二维带标签数据结构，Series是一维带标签数据结构。','DataFrame像整张Excel表，df["amount"]像选出金额一列。先看每行是什么，再操作。',`import pandas as pd
df = pd.DataFrame({'order_id': [1, 2, 3], 'amount': [100, 80, 0]})
print(df.to_string(index=False))
print(df.shape)`,['新建包含3个游戏名称与运行次数的DataFrame。','打印一列、前两行和shape，用自己的话解释shape两个数。']],
['读取与导出CSV','完成一次文件到表格再到文件的流程。','CSV是用分隔符记录行列的文本文件；read_csv读取，to_csv导出。','导出的index=False表示不额外写出Pandas行号。路径在软件workspace内，示例只写自己的练习文件。',`import pandas as pd
df = pd.DataFrame({'channel': ['A', 'B'], 'sales': [120, 80]})
df.to_csv('practice_sales.csv', index=False, encoding='utf-8-sig')
loaded = pd.read_csv('practice_sales.csv')
print(loaded.to_string(index=False))`,['生成包含游戏名和浏览量的CSV，再读回并核对行数。','试比较有无index=False的导出列，说明多出的列是什么。']],
['读取与导出Excel','选择工作表并保存处理结果。','read_excel把工作表读为DataFrame；to_excel写入Excel文件，openpyxl提供xlsx支持。','文件是一本书，sheet_name是选其中一页。先打印列名，避免假定名称与想的一样。',`import pandas as pd
df = pd.DataFrame({'game': ['星港', '雨林'], 'runs': [30, 12]})
df.to_excel('practice_games.xlsx', index=False, sheet_name='运营')
loaded = pd.read_excel('practice_games.xlsx', sheet_name='运营')
print(loaded.to_string(index=False))`,['导出含名称、浏览、运行三列的Excel并重新读取。','打印columns和dtypes，说明数量列是否为数字。']],
['筛选行与选择列','从业务表里拿到指定渠道的有效记录。','布尔筛选按条件选择行，loc用行条件和列标签选择所需部分。','像SQL WHERE加SELECT。多个条件用&和|，每个条件加括号，不直接用Python的and连接整列。',`import pandas as pd
df = pd.DataFrame({'channel': ['A','B','A'], 'amount': [100,80,0]})
result = df.loc[(df['channel']=='A') & (df['amount']>0), ['channel','amount']]
print(result.to_string(index=False))`,['筛出A渠道且金额>=80的记录，只显示渠道与金额。','改成A或B渠道，解释为什么条件各自要有括号。']],
['排序、改名与行索引','让交付的表有清楚列名和稳定顺序。','sort_values按列值排列行；rename重命名标签；索引是Pandas的行标签。','排序不会自动重编索引。行号不是订单号，reset_index不应该拿来修改真实编号。',`import pandas as pd
df = pd.DataFrame({'id': [1,2,3], 'spend': [80,120,120]})
result = df.rename(columns={'spend':'total_spend'}).sort_values(['total_spend','id'], ascending=[False,True])
print(result.to_string(index=False))`,['金额降序、并列客户号升序排列，保留全部记录。','只取前两行，并说明固定两人和保留并列前两名的区别。']],
['新增指标列','用整列运算计算每条记录的指标。','向量化运算对整列执行计算，通常比逐行手写循环更清晰。','不用每条记录写一次相同公式。先检查分母，再生成数值列；显示文字不代替数值。',`import pandas as pd
df = pd.DataFrame({'sales':[120,80], 'orders':[3,2]})
df['average_order'] = df['sales'] / df['orders']
print(df.to_string(index=False))`,['建立收入与订单数两列，新增客单价列。','导出包含新增列的CSV；今天用正订单数，零分母下区域再处理。']],
['表格群岛测试','独立完成读表、筛选和导出。','阶段任务将多个已学步骤组合成一个交付结果。','像接到一份渠道日报：先核对字段，再筛选、排序、生成指标。',`# 测试数据，可继续在下方处理。
import pandas as pd
df = pd.DataFrame({'channel':['A','B','A'], 'sales':[100,80,60], 'orders':[2,2,1]})`,['保存CSV再读取，筛A渠道并按sales降序。','新增每单收入列，导出结果为Excel。','写出输入行数、输出行数和字段列表。']],
['数字类型与错误转换','识别金额中的文字并转换为数字。','to_numeric将值转换为数值，errors="coerce"使无法转换的值成为缺失。','"90"外观像数字但可能是文字。不要用强行转换把错误金额悄悄变成0；先数多少条转换失败。',`import pandas as pd
df = pd.DataFrame({'raw':['120','80.5','unknown']})
df['amount'] = pd.to_numeric(df['raw'], errors='coerce')
print(df.to_string(index=False))`,['转换["30", "0", "bad", "75.2"]并统计转换失败数量。','保留raw列，说明为什么暂时不把失败值补0。']],
['缺失值与零分母','区分0、未知和没有可计算对象。','isna识别缺失；fillna按规则填补；where保留符合条件的值。','0元是一条已知金额，缺失是不知道。分母0时平均或比例不可计算，不能自动当0。',`import pandas as pd
df = pd.DataFrame({'sales':[100,None,0], 'orders':[2,1,0]})
df['average'] = df['sales'] / df['orders'].where(df['orders'] != 0)
print(df.to_string(index=False))`,['统计金额缺失条数，并分别说明哪些列可以补0。','写出分母0时保留缺失的平均单价，核对正常行不变。']],
['重复记录与业务编号','按真正唯一编号判断重复。','duplicated检测重复，drop_duplicates按指定列保留记录。','同金额两笔订单不是重复。先确认order_id才是订单身份；不要对金额去重来修订单总额。',`import pandas as pd
df = pd.DataFrame({'order_id':[1,1,2], 'amount':[100,100,100]})
print(df.duplicated('order_id').tolist())
print(df.drop_duplicates('order_id').to_string(index=False))`,['构造重复订单号但同金额的例子，按订单号去重并核对总额。','如果同订单号金额不一致，说明为什么不能直接任意删一行。']],
['日期转换与时间范围','按明确的时间区间筛选数据。','to_datetime转换日期时间，dt提供日期列上的时间属性。','先把文字变成日期。月份筛选用含起点、不含下月起点，避免漏掉月末时间。',`import pandas as pd
df = pd.DataFrame({'date':['2026-09-30','2026-10-01','2026-11-01']})
df['date'] = pd.to_datetime(df['date'])
result = df.loc[(df['date']>='2026-10-01') & (df['date']<'2026-11-01')]
print(result.to_string(index=False))`,['加入10月31日23:59的记录，验证仍在10月范围内。','新增年月列，检查非法日期用errors="coerce"后的数量。']],
['文字清理与渠道统一','消除前后空格及大小写带来的分组差异。','str访问器将字符串方法应用于Series。','" A "和"a"可能是同一渠道，却会被分成不同组；统一前保留原值便于追溯。',`import pandas as pd
df = pd.DataFrame({'raw_channel':[' A ','a',' B']})
df['channel'] = df['raw_channel'].str.strip().str.upper()
print(df.to_string(index=False))`,['清理含空格、大小写不同的渠道列，展示前后变化。','对真实缺失值保留缺失，不把它变成字符串"nan"当渠道。']],
['质量检查与核对总量','处理后确认没有误删或放大数据。','数据校验是检查行数、唯一键、缺失、取值范围和汇总总量是否符合约定。','代码能运行还不够：原来3单清洗后为什么2单？少的那条是什么？把变化说明白。',`import pandas as pd
df = pd.DataFrame({'order_id':[1,2,3], 'amount':[100,0,80]})
print('行数',len(df))
print('唯一订单',df['order_id'].nunique())
print('总额',df['amount'].sum())
print('金额缺失',df['amount'].isna().sum())`,['给重复号、缺金额各一条，输出4项检查。','写两条你会在导出前核对的业务规则，并说明异常怎么处理。']],
['清洗山脉测试','独立写出可追溯的清洗流程。','清洗报告交代原始问题、处理规则和处理后变化。','测试不是把脏值全删掉，而是做合理选择并保留证据。',`import pandas as pd
df = pd.DataFrame({'id':[1,1,2,3], 'amount':['100','100','bad','0'], 'channel':[' A ','A','b','C']})`,['按订单号处理重复，转换金额，统一渠道。','输出清洗前后行数、总额、缺失数量，不随意把bad补0。','说明冲突重复或负金额出现时应先确认的业务规则。']],
['分组与多个汇总指标','每渠道一行，同时算订单数与金额。','groupby按键分组，agg指定聚合函数；size数行，count数非缺失。','像SQL GROUP BY。先说每行是订单，再决定数行是否就是订单数。',`import pandas as pd
df = pd.DataFrame({'channel':['A','A','B'], 'amount':[100,0,80]})
result = df.groupby('channel',as_index=False).agg(order_count=('amount','size'),sales=('amount','sum'))
print(result.to_string(index=False))`,['加一列customer_id，按渠道输出订单数、购买人数和金额。','比较size与count在金额缺失时的不同结果。']],
['条件聚合与人数占比','先一人一行，再计算达标人数比例。','条件标记把是否满足要求表示为布尔或0/1，再在正确人群上汇总。','别先删掉未达标人群再当总体。客户一人一行时，True求和数符合人数。',`import pandas as pd
df = pd.DataFrame({'customer_id':[1,2,3], 'orders':[2,1,1]})
df['repeat'] = df['orders'] >= 2
print('购买人数',len(df))
print('复购人数',df['repeat'].sum())
print('复购率',round(df['repeat'].mean()*100,2))`,['对客户订单数[3,1,2,1]算复购人数及比例。','解释为什么对原始订单行直接求这个mean可能不等于人数占比。']],
['多表合并与保留范围','把客户信息匹配到订单。','merge按键连接DataFrame，how决定保留范围，validate检查连接关系。','像SQL JOIN。客户表是一客一行，订单表一客多行，所以订单对客户是many_to_one。',`import pandas as pd
orders = pd.DataFrame({'customer_id':[1,1,2], 'amount':[100,80,60]})
customers = pd.DataFrame({'customer_id':[1,2,3], 'name':['林杉','周禾','许岸']})
result = orders.merge(customers,on='customer_id',how='left',validate='many_to_one')
print(result.to_string(index=False))`,['换成客户左连接订单，解释没下单的客户是否出现。','故意给客户表重复编号，查看validate报错并解释。']],
['连接前汇总，避免重复算钱','商品先按订单汇总，再连接订单金额。','预聚合先把明细汇总到连接要求的粒度，避免主表指标重复。','你SQL周测的同一问题：先每订单一行，再按order_id连接。最终客户分组救不回已经复制的钱。',`import pandas as pd
orders = pd.DataFrame({'order_id':[1,2], 'amount':[100,100]})
items = pd.DataFrame({'order_id':[1,1,2], 'quantity':[2,1,1]})
totals = items.groupby('order_id',as_index=False)['quantity'].sum()
result = orders.merge(totals,on='order_id',validate='one_to_one')
print(result.to_string(index=False))
print('总额',result['amount'].sum())`,['展示商品汇总前3行、汇总后2行，核对金额200和件数4。','直接连接商品后求金额，比较错误结果；说明不能按amount去重。']],
['拼接与透视表','合并同结构日报，生成渠道月份表。','concat沿指定方向拼接对象；pivot_table按行列维度聚合。','上下拼表不是左右JOIN。透视表是同一结果换成更适合比较的布局。',`import pandas as pd
a = pd.DataFrame({'month':['09'], 'channel':['A'], 'sales':[100]})
b = pd.DataFrame({'month':['10','10'], 'channel':['A','B'], 'sales':[120,80]})
df = pd.concat([a,b],ignore_index=True)
print(df.pivot_table(index='month',columns='channel',values='sales',aggfunc='sum',fill_value=0).to_string())`,['合并两张同列名日报，再按渠道汇总。','生成月×渠道透视表，说明填0依赖什么业务假设。']],
['保留明细的组内统计与排名','为每位客户附上组内总额和消费排名。','transform生成与输入索引对齐的组内结果；rank按规则给值排名。','groupby汇总会缩行，transform把组内总额贴回每行。并列规则必须先约定。',`import pandas as pd
df = pd.DataFrame({'channel':['A','A','B'], 'spend':[120,80,60]})
df['channel_sales'] = df.groupby('channel')['spend'].transform('sum')
df['rank'] = df.groupby('channel')['spend'].rank(method='dense',ascending=False)
print(df.to_string(index=False))`,['加入同渠道并列120，比较dense和min名次。','取每渠道固定一位，先明确金额与客户号的排序，再head(1)。']],
['汇总原野测试','交付一份不会重复计算的渠道报告。','综合校验围绕输出粒度、键和总量展开。','用本区示例订单、商品和客户表组合，不引入新语法。',`# 本区阶段测试：请自行建立三张小表。
import pandas as pd`,['建立至少两张同金额订单，其中一张有两条商品明细。','先按订单汇总商品，再接客户渠道，输出渠道金额与件数。','给出连接前后行数与总额核对，再输出每渠道消费第一位客户。']],
['月度趋势、环比与累计','先按月汇总，再与上一月比较。','shift取前后行值，cumsum计算累计；结果依赖已确定的排序。','像SQL LAG与SUM OVER。缺月时上一行不一定是上个自然月，先核对月份连续。',`import pandas as pd
df = pd.DataFrame({'month':['2026-08','2026-09','2026-10'], 'sales':[50,280,360]}).sort_values('month')
df['previous'] = df['sales'].shift(1)
df['cumulative'] = df['sales'].cumsum()
df['growth_pct'] = ((df['sales']-df['previous'])/df['previous'].where(df['previous']!=0)*100).round(2)
print(df.to_string(index=False))`,['为两个渠道分别计算按月环比，不能跨渠道取上一行。','用文字说明缺9月数据时，10月环比如何标记或补月。']],
['移动平均与波动','观察最近几条记录的平滑趋势。','rolling建立滑动窗口，对窗口内值计算统计量。','最近3行平均不一定是最近3个自然日，先确认每天一行且没有缺日。',`import pandas as pd
df = pd.DataFrame({'day':[1,2,3,4], 'runs':[10,30,20,40]})
df['avg_3_rows'] = df['runs'].rolling(3,min_periods=3).mean()
print(df.to_string(index=False))`,['手算第3、4行的3行均值，再用代码验证。','解释开头两行为什么缺失，不能随意当0。']],
['折线图与趋势表达','画清楚时间、指标和单位。','Matplotlib提供绘图对象与坐标轴；折线适合按顺序观察变化。','一张图回答一个问题。示例用英文标签避免中文字体缺失，正文仍用中文说明。',`import matplotlib.pyplot as plt
months = ['Aug','Sep','Oct']
sales = [50,280,360]
fig, ax = plt.subplots(figsize=(6,3))
ax.plot(months,sales,marker='o')
ax.set(title='Monthly sales',xlabel='Month',ylabel='Sales (CNY)')
fig.tight_layout()
print('图表会显示在运行结果下方')`,['画一张游戏每日运行次数折线图，写明时间与次数单位。','写两句由数据直接支持的发现，不编造增长原因。']],
['渠道比较与图表选择','比较不同渠道的规模与效率。','柱状图适合分类比较，散点图适合观察两个数值变量的关系。','比例高不代表贡献大，要同时看人数。画之前先汇总，不把订单明细误当渠道指标。',`import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
df = pd.DataFrame({'channel':['A','B','C'], 'sales':[200,80,120]})
fig, ax = plt.subplots(figsize=(6,3))
sns.barplot(data=df,x='channel',y='sales',ax=ax,errorbar=None,color='#347b72')
ax.set(title='Sales by channel',ylabel='Sales (CNY)')
fig.tight_layout()
print('渠道对比图已生成')`,['先按金额降序，再画渠道柱状图。','给同一渠道补人数列，说明为什么不能只看销售额判断效率。']],
['描述统计与异常值','用平均、中位数和分布理解数据。','描述统计概括数据的位置与离散程度；异常值需要结合业务确认。','一笔很大的订单能拉高平均数，中位数能补充“中间的人”是什么水平。相关不等于因果。',`import pandas as pd
s = pd.Series([20,30,40,50,800])
print('平均',s.mean())
print('中位数',s.median())
print('最小最大',s.min(),s.max())`,['比较含800与去掉800的均值和中位数，说明变化。','不能仅因为大就删除800：写出你会先核实的两件事。']],
['复购、留存与基础转化','用已去重的人群算业务比例。','留存追踪固定基准人群，基础转化率比较约定步骤的去重人数。','先懂分母，再写代码。本单元只练两月集合与基础人数，不考复杂事件时序。',`import pandas as pd
base = pd.Series([1,2,3,4]).drop_duplicates()
next_month = pd.Series([1,3,5]).drop_duplicates()
retained = base.isin(next_month)
print('基准',len(base))
print('回来',retained.sum())
print('留存率',round(retained.mean()*100,2))`,['用不同两月客户号计算留存，解释新出现者为什么不进分母。','访问80、加购20、付款5，写出相邻率和整体率的不同分母。']],
['洞察大陆测试','从指标到图表，交付有依据的说明。','分析交付需要指标定义、结果核验、图表及结论的对应。','不以图漂亮当过关，先确认数据、分母和业务范围。',`# 使用前六课的数据，自选渠道或时间场景。
import pandas as pd`,['完成月汇总、环比与一张图，保留首月或零分母的缺失。','输出一个基础留存或转化指标，列分子分母。','写三句：观察到什么、还不知道什么、下一步查什么。']],
['文件路径与批量日报','重复读取同结构数据并统一处理。','pathlib用对象处理文件路径；glob按规则寻找文件。','工作目录是一间工作室，文件名是其中的资料；只合并明确的输入目录，避免把结果文件再读进去。',`from pathlib import Path
import pandas as pd
folder = Path('batch_practice')
folder.mkdir(exist_ok=True)
for day, sales in [('01',100),('02',120)]:
    pd.DataFrame({'day':[day],'sales':[sales]}).to_csv(folder/f'input_{day}.csv',index=False)
frames = [pd.read_csv(p) for p in sorted(folder.glob('input_*.csv'))]
print(pd.concat(frames,ignore_index=True).to_string(index=False))`,['为3天生成同结构输入文件，只合并input_开头的CSV。','在拼接前检查列名一致；不一致时给出明确提示。']],
['把流程写成可复用函数','更换输入后仍能稳定产出。','函数封装输入、处理和返回，异常处理对已知失败给出清晰信息。','不要把几十行代码复制三份。函数只负责一项清楚的任务，保留处理规则。',`import pandas as pd
def channel_report(df):
    required = {'channel','amount'}
    if not required.issubset(df.columns):
        raise ValueError('缺少channel或amount列')
    return df.groupby('channel',as_index=False)['amount'].sum()

df = pd.DataFrame({'channel':['A','A','B'],'amount':[100,80,60]})
print(channel_report(df).to_string(index=False))`,['封装清洗金额并保留失败记录的函数。','换一份输入验证结果，不把所有异常都静默忽略。']],
['SQL结果与Pandas衔接','把已查询好的数据交给Python继续处理。','read_sql_query把SQL查询结果读成DataFrame；连接对象负责数据库通信。','先用内存SQLite练衔接，不要求密码，也不连接公司库。将来MySQL连接另配只读账号和驱动。',`import sqlite3
import pandas as pd
with sqlite3.connect(':memory:') as conn:
    pd.DataFrame({'channel':['A','A','B'],'amount':[100,80,60]}).to_sql('orders',conn,index=False)
    df = pd.read_sql_query('SELECT channel, SUM(amount) AS sales FROM orders GROUP BY channel',conn)
    print(df.to_string(index=False))`,['同一份数据分别用SQL与Pandas分组汇总，核对结果。','说明真实数据库凭据为什么不应该直接写进公开项目代码。']],
['社媒运营小项目','将内容表现转成一份可复现分析。','项目问题应明确目标、数据范围、指标和输出。','先做一张能解释的表，再画图；不需要一次实现所有指标。',`import pandas as pd
df = pd.DataFrame({'post':['海风','星港','雨林'],'views':[1000,500,800],'likes':[80,20,64]})
df['like_pct'] = (df['likes']/df['views']*100).round(2)
print(df.sort_values('like_pct',ascending=False).to_string(index=False))`,['自建至少8条合成内容记录，包含日期、渠道、浏览、互动；声明为合成数据。','检查重复与缺失，按渠道汇总，画一张图并写业务发现。']],
['游戏运营小项目','区分浏览次数、运行次数与用户数。','指标定义约定计数对象与观察窗口，不同事件总量不能随意当作去重用户转化。','你截图里运行次数可能大于浏览次数；没有用户明细和平台口径，不要把总运行÷总浏览直接解释为用户转化率。',`import pandas as pd
df = pd.DataFrame({'game':['星港','雨林'],'views':[100,40],'runs':[120,10]})
df['runs_per_view'] = df['runs']/df['views']
print(df.to_string(index=False))
print('这只是两种次数的比值，不是去重用户转化率')`,['准备合成游戏日报，明确每行是一游戏一天，列出至少3个可算指标。','完成清洗、趋势图和渠道或游戏比较，说明不能由汇总数据得到哪些结论。']],
['结果导出与项目说明','让别人能重复运行你的分析。','可复现交付包含输入说明、依赖、运行步骤、输出和数据限制。','不是只交一张截图。别人换同结构文件后，应知道从哪里开始、结果存在哪里。',`from pathlib import Path
import pandas as pd
out = Path('delivery_practice')
out.mkdir(exist_ok=True)
pd.DataFrame({'channel':['A','B'],'sales':[180,60]}).to_excel(out/'report.xlsx',index=False)
print('已导出',out/'report.xlsx')`,['为前一项目写输入列、运行步骤、输出路径和指标定义。','导出结果Excel与一张图，核对导出前后行数和总额。']],
['最终交付与面试复盘','独立完成一个小型数据分析任务。','结业检验的是从业务问题到数据处理、核验、结果解释的完整能力。','42站到达不自动代表求职达标。自己完成与查阅完成要分开说明；薄弱内容继续加练。',`# 最终测试：用社媒或游戏合成数据独立完成分析。
# 请在“练习答案与思路”记录查阅帮助、口径与结论。`,['独立提交可运行代码、原始合成数据、清洗说明、汇总表和图表。','更换同结构输入重新运行，验证没有把结果数字写死。','用3分钟说明业务问题、粒度、分母、质量检查、结论和限制；列出仍需复习的两点。']]
];
const lessons=courseRows.map((r,i)=>({id:i+1,region:Math.floor(i/7),checkpoint:(i+1)%7===0,title:r[0],goal:r[1],definition:r[2],plain:r[3],code:r[4],tasks:r[5],minutes:(i>=38?60:45),schedule:'5分钟回顾，15分钟示例，20分钟实操，5分钟复盘；45分钟不够时可继续，不要求同一天赶完。'}));
if(lessons.length!==42)throw Error('课程总数必须为42');
if(typeof window!=='undefined'){window.ATLAS_COURSE={regions,lessons};}else module.exports={regions,lessons};
