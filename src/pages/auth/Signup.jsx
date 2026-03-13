import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export default function Signup() {
  const navigate = useNavigate()
  const { signup, status, error } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } })

  const onSubmit = async (values) => {
    await signup(values)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          placeholder="you@company.com"
          error={errors.email?.message}
          autoComplete="email"
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          placeholder="Create a password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Min 6 characters' },
          })}
        />

        {error ? <div className="text-sm text-rose-300">{error}</div> : null}

        <Button
          className="w-full justify-center"
          type="submit"
          loading={status === 'loading'}
        >
          Create account
        </Button>
      </form>

      <div className="text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link
          className="text-zinc-100 underline underline-offset-4"
          to="/auth/login"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

