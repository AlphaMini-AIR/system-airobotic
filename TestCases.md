
# Test Cases and Test Requirement List

Đây là danh sách các yêu cầu kiểm thử (Test Requirement List) và các trường hợp kiểm thử (Test Case) chi tiết cho các trang Student, Teacher, và Client.

## I. Trang Student

### 1. Test Requirement List - Student

| TR-ID | Test Requirement                               | Yêu cầu Test                                            | TR Type      |
|-------|------------------------------------------------|---------------------------------------------------------|--------------|
| ST-001| View student list                              | Xem danh sách học sinh                                  | Functional   |
| ST-002| Search for a student                           | Tìm kiếm học sinh theo tên hoặc mã                        | Functional   |
| ST-003| View student profile                           | Xem thông tin chi tiết của một học sinh                  | Functional   |
| ST-004| View student's enrolled courses                | Xem danh sách các khóa học mà học sinh đã đăng ký       | Functional   |
| ST-005| Add student to a course                        | Thêm học sinh vào một khóa học                          | Functional   |
| ST-006| Remove student from a course                   | Xóa học sinh khỏi một khóa học                          | Functional   |
| ST-007| Handle adding a student who is already in the course | Xử lý trường hợp thêm học sinh đã có trong khóa học      | Negative     |
| ST-008| View student status in a trial course          | Xem trạng thái của học sinh trong khóa học thử           | Functional   |
| ST-009| Export student data from a course              | Xuất dữ liệu học sinh từ một khóa học                    | Functional   |
| ST-010| Check UI elements on student pages             | Kiểm tra các yếu tố giao diện trên các trang của học sinh | Look and Feel|

### 2. Test Cases - Student

<details>
<summary>Expand to see test cases for Student</summary>

| TC-ID   | Test Requirement ID | Test Objective                                      | Test Steps                                                                                                                                                           | Expected Results                                                                                             |
|---------|---------------------|-----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| ST-TC-001| ST-001              | Verify that the user can view the list of all students. | 1. Navigate to the student list page (`/student/list`).<br>2. Observe the page.                                                                                     | A list of students is displayed with relevant information (e.g., name, ID).                                  |
| ST-TC-002| ST-002              | Verify that searching for a student by name works correctly. | 1. Go to a page with a student search bar (e.g., within a course).<br>2. Enter an existing student's name.<br>3. Observe the list.                               | The list filters to show only the student(s) matching the name.                                              |
| ST-TC-003| ST-002              | Verify that searching for a student by ID works correctly. | 1. Go to a page with a student search bar.<br>2. Enter an existing student's ID.<br>3. Observe the list.                                                              | The list filters to show only the student matching the ID.                                                   |
| ST-TC-004| ST-002              | Verify searching for a non-existent student.        | 1. Go to a page with a student search bar.<br>2. Enter a name/ID that does not exist.<br>3. Observe the list.                                                        | The list becomes empty or shows a "No results found" message.                                                |
| ST-TC-005| ST-003              | Verify that the user can view a student's profile.  | 1. From the student list, click on a student's name or a "details" button.<br>2. Navigate to their profile page (`/[id]`).                                           | The student's detailed profile is displayed, including personal information.                                 |
| ST-TC-006| ST-004              | Verify viewing a student's enrolled courses.        | 1. Navigate to a student's profile.<br>2. Go to the "Courses" tab (`/[id]/courses`).                                                                                 | A list of courses the student is enrolled in is displayed.                                                   |
| ST-TC-007| ST-005              | Verify adding a new student to a course.            | 1. Open a course page.<br>2. Open the "Add Student" popup.<br>3. Search for and select a student not yet in the course.<br>4. Click "Save".                         | The student is added to the course list, and a success message appears. The student count is updated.        |
| ST-TC-008| ST-006              | Verify removing a student from a course.            | 1. On the course's student list, find a student.<br>2. Click the "Remove" or "Delete" icon.<br>3. Confirm the action.                                               | The student is removed from the list, and a success message appears. The student count is updated.           |
| ST-TC-009| ST-007              | Verify that adding a duplicate student is prevented. | 1. Open the "Add Student" popup for a course.<br>2. Try to select a student who is already in the course.                                                            | The student should either be un-selectable or an error message should appear preventing the duplicate addition. |
| ST-TC-010| ST-008              | Verify student status in a trial course.            | 1. Navigate to a trial course page (`/course/trycourse`).<br>2. Observe the student list.                                                                           | Students are listed with their attendance status (e.g., Present, Absent, Pending) and care status.           |
| ST-TC-011| ST-009              | Verify exporting student data.                      | 1. Go to a course detail page.<br>2. Find and click the "Export" button for the student list.<br>3. Check the downloaded file.                                       | A file (e.g., CSV, Excel) is downloaded containing the correct list of students and their selected data.     |
| ST-TC-012| ST-010              | Verify UI consistency on the student profile page.  | 1. Open a student profile page.<br>2. Check for clear labels, correct fonts, and consistent button styles.                                                         | All UI elements are well-aligned, readable, and follow the application's design system.                      |

</details>

## II. Trang Teacher

### 1. Test Requirement List - Teacher

| TR-ID | Test Requirement                               | Yêu cầu Test                                            | TR Type      |
|-------|------------------------------------------------|---------------------------------------------------------|--------------|
| TE-001| View teacher statistics                        | Xem thống kê về giáo viên                               | Functional   |
| TE-002| Filter statistics by time period               | Lọc thống kê theo khoảng thời gian (tuần, tháng, quý, năm) | Functional   |
| TE-003| View teacher performance metrics               | Xem các chỉ số hiệu suất của giáo viên (buổi dạy, trợ giảng) | Functional   |
| TE-004| View teacher violation metrics                 | Xem các chỉ số vi phạm của giáo viên (điểm danh, nhận xét) | Functional   |
| TE-005| View teacher's main dashboard/overview         | Xem trang tổng quan chính của giáo viên                  | Functional   |
| TE-006| Check UI elements on teacher pages             | Kiểm tra các yếu tố giao diện trên các trang của giáo viên | Look and Feel|

### 2. Test Cases - Teacher

<details>
<summary>Expand to see test cases for Teacher</summary>

| TC-ID   | Test Requirement ID | Test Objective                                      | Test Steps                                                                                                                                                           | Expected Results                                                                                             |
|---------|---------------------|-----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| TE-TC-001| TE-001              | Verify that teacher statistics are displayed.       | 1. Navigate to the admin teacher statistics page (`/admin`).<br>2. Observe the page.                                                                                 | A chart or table showing teacher statistics is displayed.                                                    |
| TE-TC-002| TE-002              | Verify filtering statistics by "week".              | 1. On the statistics page, select the "week" filter.<br>2. Choose a specific week.                                                                                   | The statistics update to show data only for the selected week.                                               |
| TE-TC-003| TE-002              | Verify filtering statistics by "month".             | 1. On the statistics page, select the "month" filter.<br>2. Choose a specific month.                                                                                 | The statistics update to show data only for the selected month.                                              |
| TE-TC-004| TE-002              | Verify filtering statistics by "quarter".           | 1. On the statistics page, select the "quarter" filter.<br>2. Choose a specific quarter.                                                                             | The statistics update to show data only for the selected quarter.                                            |
| TE-TC-005| TE-003              | Verify viewing teacher performance metrics.         | 1. On the statistics page, ensure the chart is set to "performance" view.<br>2. Hover over the chart bars.                                                         | The chart displays "Buổi dạy" (teaching sessions) and "Buổi trợ giảng" (TA sessions) for each teacher.        |
| TE-TC-006| TE-004              | Verify viewing teacher violation metrics.           | 1. On the statistics page, switch the chart to "violation" view.<br>2. Hover over the chart bars.                                                                    | The chart displays "Lỗi điểm danh" (attendance violations), "Lỗi nhận xét" (comment violations), etc.        |
| TE-TC-007| TE-005              | Verify the main teacher overview page is accessible. | 1. Log in as a teacher.<br>2. Navigate to the teacher overview page (`/teacher/overview`).                                                                         | The teacher's personal dashboard loads with relevant information (e.g., their schedule, assigned courses).   |
| TE-TC-008| TE-006              | Verify UI consistency on the statistics page.       | 1. Open the teacher statistics page.<br>2. Check that filters, charts, and tables are clearly labeled and easy to understand.                                        | All UI elements are well-organized, visually appealing, and function as expected.                            |

</details>

## III. Trang Client

### 1. Test Requirement List - Client

| TR-ID | Test Requirement                               | Yêu cầu Test                                            | TR Type      |
|-------|------------------------------------------------|---------------------------------------------------------|--------------|
| CL-001| View client list                               | Xem danh sách khách hàng                                | Functional   |
| CL-002| View client interaction history                | Xem lịch sử tương tác với khách hàng                     | Functional   |
| CL-003| Add a new client                               | Thêm một khách hàng mới                                 | Functional   |
| CL-004| Edit client information                        | Chỉnh sửa thông tin khách hàng                          | Functional   |
| CL-005| Search for a client                            | Tìm kiếm khách hàng                                     | Functional   |
| CL-006| Check UI elements on client pages              | Kiểm tra các yếu tố giao diện trên các trang của khách hàng | Look and Feel|

### 2. Test Cases - Client

<details>
<summary>Expand to see test cases for Client</summary>

| TC-ID   | Test Requirement ID | Test Objective                                      | Test Steps                                                                                                                                                           | Expected Results                                                                                             |
|---------|---------------------|-----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| CL-TC-001| CL-001              | Verify that the user can view the list of clients.  | 1. Navigate to the client page (`/client`).<br>2. Observe the main content area.                                                                                     | A list of clients is displayed with key information like name, contact, etc.                                 |
| CL-TC-002| CL-002              | Verify viewing a client's interaction history.      | 1. From the client list, select a client.<br>2. Look for a section or tab labeled "History" or "Lịch sử".                                                             | The interaction history for that client is displayed, showing past communications or actions.                |
| CL-TC-003| CL-003              | Verify adding a new client.                         | 1. On the client page, find and click the "Add New" or "Thêm mới" button.<br>2. Fill out the required fields in the form.<br>3. Click "Save".                       | The new client is added to the client list, and a success message is shown.                                  |
| CL-TC-004| CL-003              | Verify form validation when adding a new client.    | 1. Open the "Add New" client form.<br>2. Try to submit the form with empty required fields.                                                                          | An error message appears for each required field that is empty. The form is not submitted.                   |
| CL-TC-005| CL-004              | Verify editing an existing client's information.    | 1. Select a client from the list.<br>2. Click an "Edit" button.<br>3. Change some information (e.g., phone number).<br>4. Click "Save".                             | The client's information is updated in the list, and a success message is shown.                             |
| CL-TC-006| CL-005              | Verify searching for a client.                      | 1. On the client page, use the search bar.<br>2. Enter the name of an existing client.<br>3. Observe the list.                                                       | The list filters to show only the client(s) matching the search query.                                       |
| CL-TC-007| CL-006              | Verify UI consistency on the client page.           | 1. Open the client page.<br>2. Check for consistent styling of buttons, input fields, and tables.                                                                  | The user interface is clean, responsive, and all elements are aligned correctly.                             |

</details>
