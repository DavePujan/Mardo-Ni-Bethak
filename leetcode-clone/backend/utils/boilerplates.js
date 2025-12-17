module.exports = {
    js: (userCode, fn, input) => `
const fs = require("fs");
const input = \`${input}\`.trim();

${userCode}

const args = input.split(" ").map(Number);
console.log(${fn}(...args));
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
`
};
