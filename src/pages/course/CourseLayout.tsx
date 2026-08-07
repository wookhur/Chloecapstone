import { NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { accent, subjectColor } from '../../lib/subjectColor';
import { displayName } from '../../lib/names';
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
  /** Only people actually in the course may post to it. Anyone may read. */
  const canPost = enrolled || isCourseTeacher;

  return (
    <div className="course-shell">
      {/* The subject colour is in the rule under the title, not in the title.
          A 2rem heading set in the accent reads as a link you failed to click,
          and it makes the loudest thing on the page a decoration. */}
      <div className="course-header" style={accent(color)}>
        <div>
          <h1>{cls.name}</h1>
          <p className="sub">
            {cls.subject} · Grade {cls.grade_level} · {cls.period} · Room {cls.room ?? '—'} ·{' '}
            {displayName(teacher)}
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
            <Route path="discussions" element={<DiscussionsTab cls={cls} canPost={canPost} />} />
            <Route path="discussions/:topicId" element={<DiscussionsTab cls={cls} canPost={canPost} />} />
            <Route path="people" element={<PeopleTab cls={cls} />} />
            <Route path="files" element={<FilesTab cls={cls} />} />
            <Route path="quizzes" element={<QuizzesTab cls={cls} canPost={canPost} />} />
            {/* Declared before the :quizId route so "bank" isn't read as a quiz id. */}
            <Route path="quizzes/bank/practice" element={<QuizTake cls={cls} mode="bank" />} />
            <Route path="quizzes/:quizId/practice" element={<QuizTake cls={cls} />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
