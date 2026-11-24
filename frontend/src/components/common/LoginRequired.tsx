import { Button, Result } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface Props {
  message?: string
}

export default function LoginRequired({ message = '이 기능은 클럽 회원만 이용할 수 있습니다.' }: Props) {
  const navigate = useNavigate()

  return (
    <Result
      icon={<LockOutlined style={{ color: '#1677ff' }} />}
      title="로그인이 필요합니다"
      subTitle={message}
      extra={[
        <Button type="primary" key="login" size="large" onClick={() => navigate('/auth/login')}>
          로그인 / 회원가입
        </Button>,
        <Button key="back" onClick={() => navigate(-1)}>
          돌아가기
        </Button>,
      ]}
    />
  )
}
