import { NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { subjectColor } from '../../lib/subjectColor';
import CourseHome from './CourseHome';
import AnnouncementsTab from './AnnouncementsTab';
import AssignmentsTab from './AssignmentsTab';
import AssignmentDetail from './AssignmentDetail';
import DiscussionsTab from './DiscussionsTab';
import QuizzesTab from './QuizzesTab';
import QuizTake from './QuizTake';
import PeopleTab from './PeopleTab';
import FilesTab from './FilesTab';

const COURSE_NAV = [
  { to: 'home', label: 'Home' },
  { to: 'announcements', label: 'Announcements' },
  { to: 'assignments', label: 'Assignments' },
  { to: 'discussions', label: 'Discussions' },
  { to: 'quizzes', label: 'Practice Quizzes' },
  { to: 'people', label: 'People' },
  { to: 'files', label: 'Files' },
];

/** Canvas course shell: course header + left course menu + tab content. */
export default function CourseLayout() {
  const { classId } = useParams<{ classId: string }>();
  const { classById, profileById, currentUser, myClassIds } = useApp();

  const cls = classId ? classById(classId) : undefined;
  if (!cls) return <div className="empty">Course not found.</div>;

  const color = subjectColor(cls.subject);
  const teacher = profileById(cls.teacher_id);
  const enrolled = myClassIds.includes(cls.id);
  const isCourseTeacher = currentUser?.id === cls.teacher_id;

  return (
    <div className="course-shell">
      <div className="course-header" style={{ borderColor: color }}>
        <div>
          <h1 style={{ color }}>{cls.name}</h1>
          <p className="sub">
            {cls.subject} · Grade {cls.grade_level} · {cls.period} · Room {cls.room ?? '—'} ·{' '}
            {teacher?.name}
          </p>
        </div>
        {!enrolled && !isCourseTeacher && (
          <span className="chip">You aren't enrolled in this course</span>
        )}
      </div>

      <div className="course-body">
        <nav className="course-nav">
          {COURSE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="course-content">
          <Routes>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<CourseHome cls={cls} />} />
            <Route path="announcements" element={<AnnouncementsTab cls={cls} />} />
            <Route path="assignments" element={<AssignmentsTab cls={cls} />} />
            <Route path="assignments/:assignmentId" element={<AssignmentDetail cls={cls} />} />
            <Route path="discussions" element={<DiscussionsTab cls={cls} />} />
            <Route path="discussions/:topicId" element={<DiscussionsTab cls={cls} />} />
            <Route path="people" element={<PeopleTab cls={cls} />} />
            <Route path="files" element={<FilesTab cls={cls} />} />
            <Route path="quizzes" element={<QuizzesTab cls={cls} />} />
            <Route path="quizzes/:quizId/practice" element={<QuizTake cls={cls} />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
