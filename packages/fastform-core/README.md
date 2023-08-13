# A form builder based on carbon framework

A form is build using question and answers

questions are represented using bigger fonts like H3
answer can be any kind of inputs
example

1. short text
2. long text
3. Multiple choice question
4. Checkboxes
5. Rating
6. etc.

fastform depends on fastype blocks for other filler blocks like
image, video, hstack, code, tables, headers.

User interaction
each input needs a title to identify with
when a title of H3 size is inserted before a input without title the H3 is converted to a question
when a input is inserted after a question the input is linked to the question

Once the question title and the input is linked the conditional logic can be used to check the question input on input or on submit.
