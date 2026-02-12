// Write a function to reverse a string.         done

// Write a program to check if a number is even or odd.     done

// Write a function to find the maximum number in an array.    done 

// Write a program to count vowels in a string.   done

// Write a function to remove duplicates from an array.    done 

// Write a program to check if a string is palindrome.   done

// Write a function to sum all numbers in an array.     done

// Write a program to find factorial of a number.

// Write a function to capitalize first letter of each word.          done

// Write a program to swap two numbers without using a third variable.        done





// let str = "abbacde"

// function reverseStr(str){
//     let arr = str.split("").reverse().join("");
//     return arr;
// }

// const input = reverseStr(str)
// console.log(input);



// function duplicate(str){
//     let arr = [];
//     for(let i=0; i <= str.length; i++){
//         let a = str[i];
//         for(let j=i+1; j<=str.length; j++){
//             let b = str[j];
//             if(a === b && !arr.includes(a)){
//                 arr.push(a);
//             }
//         }
//     }
//     return arr
// }
// const input = duplicate(str)
// console.log(input,"------------------------------->");


// function palindrome(str){
//     let a = str.split("").reverse().join("");
//     if(str == a){
//         console.log(str);
//         console.log(a);
//         return "yes"
//     }
//     else{
//         console.log(str);
//         console.log(a);
//         return "no"
//     }  
// }


// function checkEvenOdd(num){
//     if(num % 2 === 0) return "even"
//     else return"false"
// }

// console.log(checkEvenOdd(2421))



// let arr = [10, 20, 30, 40, 50]; // 33

// function add(arr){
//     return arr.reduce((a, b) => {
//         return a + b;
//     })
// }

// const sum = add(arr)
// console.log(sum);



// let arr = [2, 6, 1, 8, 4, 5, 2,9];
// let name = "syed Mehdi"


// function findMax(arr){
//     let max = arr[0];
//     for(let i = 0; i < arr.length; i++){
//         if(arr[i+1] > max){
//             max = arr[i+1]
//         }
//     }
//     return max
// }


// let arr = [2, 6, 1, 8, 4, 5, 2,9, 1];
// function findMax(arr){
//     return Math.max(...arr)
// }

// console.log(findMax(arr))


// function cnVowels(arr){
//     let count=0;
//     for(let i = 0; i < arr.length; i++){
//         if(arr[i] === 'a'){
//             count++;
//         }else if((arr[i] === 'e')){
//             count++;
//         }else if((arr[i] === 'i')){
//             count++;
//         }else if((arr[i] === 'o')){
//             count++;
//         }else if((arr[i] === 'u')){
//             count++;
//         }
//     }
//     return count;
// }
// let arr = "syed mehandi raza zaidi"
// console.log(cnVowels(arr))



// function swap(a, b){
//     return [a,b] = [b,a];
// }

// console.log(swap(5,3))