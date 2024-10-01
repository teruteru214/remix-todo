import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, json, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { Todo } from "~/domain/Todo";
import { supabase } from "~/lib/supabase";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async () => {
  const response = await supabase.from("todo").select("*");
  const data = response.data;

  if (!data) {
    return json({ todos: [] });
  }

  const todos = data.map((todo) => new Todo(todo.id, todo.title, todo.done));

  return json({ todos });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  if (formData.has("action")) {
    const action = formData.get("action");

    if (action == "delete") {
      const id = formData.get("id");
      await supabase.from("todo").delete().eq("id", id);
    }

    if (action == "create") {
      const title = formData.get("title") as string;
      if (!title) {
        return json({ error: "タイトルを入力してください" }, { status: 400 });
      }
      await supabase.from("todo").insert({ title, done: false });
    }
  }

  return null
};


export default function Index() {
  const { todos } = useLoaderData() as { todos: Todo[] };
  const actionData = useActionData<{ error: string }>();

  useEffect(() => {
    if (!actionData?.error) {
      closeModal();
      (document.getElementById("title") as HTMLInputElement).value = "";
    }
  }, [actionData]); // エラーがなければフォームの初期化とモーダルを閉じる

  const closeModal = () => {
    (document.getElementById("my_modal_1") as HTMLDialogElement).close();
  };

  return (
    <div className="font-sans m-80">
      <h1 className="text-2xl font-bold mb-8">やることリスト</h1>
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-center border-b border-gray-300 py-2"
        >
          <div className="flex-grow">{todo.title}</div>
          <Form method="post">
            <input type="hidden" name="id" value={todo.id} />
            <button
              name="action"
              value="delete"
              className="text-red-500"
              type="submit"
            >
              ☓
            </button>
          </Form>
        </div>
      ))}
      <div className="mt-8 flex justify-end">
        <button
          className="btn btn-success"
          onClick={() => {
            (
              document.getElementById("my_modal_1") as HTMLDialogElement
            ).showModal();
          }}
        >
          新規登録
        </button>
      </div>

      <dialog id="my_modal_1" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">新規登録</h3>
          <div className="label-text mb-4">やること</div>
          <Form method="post">
            {actionData?.error && (
              <div className="text-red-500">{actionData.error}</div>
            )}
            <input
              type="text"
              className="input input-bordered w-full mb-4"
              name="title"
              id="title"
            />
            <div className="flex">
              <button
                className="btn btn-primary mr-4"
                type="submit"
                name="action"
                value="create"
              >
                登録
              </button>
              <button className="btn" type="button" onClick={closeModal}>
                閉じる
              </button>
            </div>
          </Form>
        </div>
      </dialog>
    </div>
  );
}
