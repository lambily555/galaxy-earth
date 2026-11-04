import ast
import json
import sys

# Parse only: never execute submitted code while checking a sentence.
data = json.load(sys.stdin)
try:
    actual = ast.parse(data['answer'])
except SyntaxError as exc:
    print(json.dumps({'status': 'syntax', 'feedback': f'第{exc.lineno}行的语法不能解析：{exc.msg}。检查冒号、括号、引号，以及代码块缩进。'}, ensure_ascii=False))
    sys.exit()
expected = ast.parse(data['expected'])
class Normalize(ast.NodeTransformer):
    def visit_Call(self, node):
        self.generic_visit(node)
        if all(k.arg is not None for k in node.keywords):
            node.keywords.sort(key=lambda k: k.arg)
        return node

def signature(node):
    return ast.dump(Normalize().visit(node), include_attributes=False)

if not actual.body:
    result = {'status': 'empty', 'feedback': '还没有写入代码。请先写当前这一步。'}
elif signature(actual) == signature(expected):
    result = {'status': 'correct', 'feedback': '正确，这句与要求一致。已接入完整代码，继续下一句。'}
else:
    # A different AST is not proof that an alternative algorithm is wrong.
    details = []
    if len(actual.body) != len(expected.body):
        details.append('本次只提交当前一个步骤，不要把前面已完成的代码再贴一遍')
    def assigned(tree):
        return sorted(ast.dump(t, include_attributes=False) for n in tree.body if isinstance(n, ast.Assign) for t in n.targets)
    if assigned(actual) != assigned(expected):
        details.append('检查结果保存到哪个变量或哪一列，题面中的名称要沿用')
    expected_ops = [type(n).__name__ for n in ast.walk(expected) if isinstance(n, (ast.operator, ast.cmpop))]
    actual_ops = [type(n).__name__ for n in ast.walk(actual) if isinstance(n, (ast.operator, ast.cmpop))]
    if expected_ops != actual_ops:
        details.append('检查计算符号、比较方向或条件连接方式')
    expected_values = [n.value for n in ast.walk(expected) if isinstance(n, ast.Constant)]
    actual_values = [n.value for n in ast.walk(actual) if isinstance(n, ast.Constant)]
    if expected_values != actual_values:
        details.append('核对数字、列名、文字及函数参数，是否与这一句需求一致')
    result = {'status': 'review', 'feedback': '尚未通过本题的指定写法核对。' + '；'.join(details or ['检查所用函数和调用对象']) + '。这不代表所有其他等价写法都错误；本地规则不能确认时，可记录疑问供后续复核，或采用下面的参考写法继续。'}
print(json.dumps(result, ensure_ascii=False))
