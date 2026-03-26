module.exports = {
    js: (userCode, fn, input) => `
const input = \`${input}\`.trim();

${userCode}

try {
  const args = input.split(" ").map(Number);

  let result;

  if (typeof ${fn} === "function") {
    result = ${fn}(...args);
  } else if (typeof globalThis["${fn}"] === "function") {
    result = globalThis["${fn}"](...args);
  } else {
    throw new Error("Function ${fn} not found");
  }

  console.log(result);
} catch (err) {
  console.error(err.message);
}
`,

  javascript: (userCode, fn, input) => `
const input = \`${input}\`.trim();

${userCode}

try {
  const args = input.split(" ").map(Number);

  let result;

  if (typeof ${fn} === "function") {
    result = ${fn}(...args);
  } else if (typeof globalThis["${fn}"] === "function") {
    result = globalThis["${fn}"](...args);
  } else {
    throw new Error("Function ${fn} not found");
  }

  console.log(result);
} catch (err) {
  console.error(err.message);
}
`,

    cpp: (userCode, fn, input) => `
#include <bits/stdc++.h>
using namespace std;

${userCode}

int main(){
  string s="${input}";
  stringstream ss(s);
  int a,b; ss>>a>>b;
  cout<<${fn}(a,b);
}
`,

    c: (userCode, fn, input) => `
#include <stdio.h>

${userCode}

int main(){
  int a,b;
  sscanf("${input}","%d %d",&a,&b);
  printf("%d",${fn}(a,b));
}
`,

    python: (userCode, fn, input) => `
${userCode}

a,b=map(int,"${input}".split())
print(${fn}(a,b))
`,

    java: (userCode, fn, input) => `
import java.util.*;

public class Main {
${userCode}
public static void main(String[] args){
  Scanner sc=new Scanner("${input}");
  int a=sc.nextInt(), b=sc.nextInt();
  System.out.print(${fn}(a,b));
}
}
`,

    php: (userCode, fn, input) => `<?php
${userCode}

$input = trim("${input}");
$parts = preg_split('/\\s+/', $input);
$args = array_map('intval', $parts);

if (function_exists('${fn}')) {
  echo call_user_func_array('${fn}', $args);
} else {
  fwrite(STDERR, 'Function ${fn} not found');
}
`
};
